<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: https://www.grach-studio.ru');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, false, 'Method not allowed');
}

$config = read_config_file(dirname(dirname(__DIR__)) . '/telegram-config.php');
$token = getenv('TELEGRAM_BOT_TOKEN') ? getenv('TELEGRAM_BOT_TOKEN') : get_config_value($config, 'TELEGRAM_BOT_TOKEN');
$chatIds = get_chat_ids($config);

if (!$token || count($chatIds) === 0) {
    respond(500, false, 'Form is not configured');
}

$rawBody = file_get_contents('php://input');
$body = json_decode($rawBody, true);
if (!is_array($body)) {
    respond(400, false, 'Invalid request');
}

$name = trim((string)get_body_value($body, 'name'));
$phone = normalize_phone((string)get_body_value($body, 'phone'));
$quiz = isset($body['quiz']) && is_array($body['quiz']) ? $body['quiz'] : null;

if ($name === '' || $phone === '') {
    respond(400, false, 'Name and phone are required');
}

$name = limit_text($name, 80);

$quizBlock = '';
if ($quiz) {
    $quizBlock =
        "\n\n<b>Результат квиза</b>\n" .
        "Зона старта: " . escape_html(get_body_value($quiz, 'zone') ? get_body_value($quiz, 'zone') : get_body_value($quiz, 'hair')) . "\n" .
        "Проблема: " . escape_html(get_body_value($quiz, 'pain')) . "\n" .
        "Приоритет: " . escape_html(get_body_value($quiz, 'goal')) . "\n" .
        "Рекомендация: " . escape_html(get_body_value($quiz, 'method')) . "\n" .
        "Спеццена: " . escape_html(get_body_value($quiz, 'offer'));
}

$text =
    "<b>Новая заявка с сайта</b>\n\n" .
    "<b>Имя:</b> " . escape_html($name) . "\n" .
    "<b>Телефон:</b> <a href=\"tel:" . escape_html($phone) . "\">" . escape_html($phone) . "</a>" .
    $quizBlock;

foreach ($chatIds as $chatId) {
    $payload = json_encode(array(
        'chat_id' => $chatId,
        'text' => $text,
        'parse_mode' => 'HTML',
        'disable_web_page_preview' => true,
    ), JSON_UNESCAPED_UNICODE);

    $telegram = send_to_telegram($token, $payload);
    if (!$telegram['ok']) {
        respond(502, false, 'Telegram request failed');
    }
}

respond(200, true, null);

function get_body_value($body, $key) {
    return isset($body[$key]) ? $body[$key] : '';
}

function get_config_value($config, $key) {
    return isset($config[$key]) ? $config[$key] : '';
}

function get_chat_ids($config) {
    if (isset($config['TELEGRAM_CHAT_IDS']) && is_array($config['TELEGRAM_CHAT_IDS'])) {
        return $config['TELEGRAM_CHAT_IDS'];
    }
    if (isset($config['TELEGRAM_CHAT_ID']) && $config['TELEGRAM_CHAT_ID'] !== '') {
        return array($config['TELEGRAM_CHAT_ID']);
    }
    return array();
}

function read_config_file($path) {
    if (!is_file($path)) {
        return array();
    }

    $content = file_get_contents($path);
    if ($content === false) {
        return array();
    }

    $config = array();
    foreach (array('TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID') as $key) {
        $pattern = "/['\"]" . preg_quote($key, '/') . "['\"]\\s*=>\\s*['\"]([^'\"]+)['\"]/";
        if (preg_match($pattern, $content, $matches)) {
            $config[$key] = $matches[1];
        }
    }

    if (preg_match("/['\"]TELEGRAM_CHAT_IDS['\"]\\s*=>\\s*array\\s*\\((.*?)\\)/s", $content, $matches)) {
        preg_match_all("/['\"]([^'\"]+)['\"]/", $matches[1], $ids);
        if (isset($ids[1]) && count($ids[1]) > 0) {
            $config['TELEGRAM_CHAT_IDS'] = $ids[1];
        }
    }

    return $config;
}

function send_to_telegram($token, $payload) {
    $url = "https://api.telegram.org/bot" . $token . "/sendMessage";

    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
        curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/json'));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 15);
        $response = curl_exec($ch);
        $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        $data = $response ? json_decode($response, true) : null;
        return array('ok' => $statusCode < 400 && is_array($data) && !empty($data['ok']));
    }

    $context = stream_context_create(array(
        'http' => array(
            'method' => 'POST',
            'header' => "Content-Type: application/json\r\n",
            'content' => $payload,
            'timeout' => 15,
            'ignore_errors' => true,
        ),
    ));
    $response = file_get_contents($url, false, $context);
    $data = $response ? json_decode($response, true) : null;
    return array('ok' => is_array($data) && !empty($data['ok']));
}

function normalize_phone($value) {
    $digits = preg_replace('/\D+/', '', $value);
    if (strlen($digits) === 10) {
        return '+7' . $digits;
    }
    if (strlen($digits) === 11 && substr($digits, 0, 1) === '8') {
        return '+7' . substr($digits, 1);
    }
    if (strlen($digits) === 11 && substr($digits, 0, 1) === '7') {
        return '+' . $digits;
    }
    return '';
}

function limit_text($value, $length) {
    return function_exists('mb_substr') ? mb_substr($value, 0, $length, 'UTF-8') : substr($value, 0, $length);
}

function escape_html($value) {
    return htmlspecialchars((string)$value, ENT_QUOTES, 'UTF-8');
}

function respond($status, $ok, $error) {
    http_response_code($status);
    $payload = array('ok' => $ok);
    if ($error !== null) {
        $payload['error'] = $error;
    }
    echo json_encode($payload);
    exit;
}
