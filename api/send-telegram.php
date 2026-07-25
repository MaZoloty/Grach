<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

$allowedOrigins = array(
    'https://grach-studio.ru',
    'https://www.grach-studio.ru',
);
$origin = isset($_SERVER['HTTP_ORIGIN']) ? (string)$_SERVER['HTTP_ORIGIN'] : '';

if ($origin !== '' && in_array($origin, $allowedOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    if ($origin !== '' && !in_array($origin, $allowedOrigins, true)) {
        respond(403, false, 'Origin is not allowed');
    }
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, false, 'Method not allowed');
}

if ($origin !== '' && !in_array($origin, $allowedOrigins, true)) {
    respond(403, false, 'Origin is not allowed');
}

$configPath = dirname(dirname(__DIR__)) . '/telegram-config.php';
$config = read_config_file($configPath);
$formEnabled = config_flag('CONSULTATION_FORM_ENABLED', $config);

// Fail closed: without an explicit server-side flag the endpoint never accepts personal data.
if (!$formEnabled) {
    respond(503, false, 'Consultation form is temporarily unavailable');
}

$contentLength = isset($_SERVER['CONTENT_LENGTH']) ? (int)$_SERVER['CONTENT_LENGTH'] : 0;
if ($contentLength > 16384) {
    respond(413, false, 'Request is too large');
}

$token = env_or_config('TELEGRAM_BOT_TOKEN', $config);
$chatIds = get_chat_ids($config);
$consentSecret = env_or_config('CONSENT_LOG_SECRET', $config);

if (!$token || count($chatIds) === 0 || strlen($consentSecret) < 32) {
    respond(500, false, 'Form is not configured safely');
}

$rawBody = file_get_contents('php://input');
if ($rawBody === false || strlen($rawBody) > 16384) {
    respond(413, false, 'Request is too large');
}

$body = json_decode($rawBody, true);
if (!is_array($body)) {
    respond(400, false, 'Invalid request');
}

// Honeypot: legitimate visitors never fill this field.
if (trim((string)get_body_value($body, 'website')) !== '') {
    respond(200, true, null);
}

$expectedConsentVersion = '2026-07-25';
$consentAccepted = get_body_value($body, 'consent') === true;
$adultConfirmed = get_body_value($body, 'adultConfirmed') === true;
$consentVersion = trim((string)get_body_value($body, 'consentVersion'));

if (!$consentAccepted || !$adultConfirmed || $consentVersion !== $expectedConsentVersion) {
    respond(400, false, 'Valid consent is required');
}

$name = clean_text((string)get_body_value($body, 'name'), 80);
$phone = normalize_phone((string)get_body_value($body, 'phone'));
$quiz = isset($body['quiz']) && is_array($body['quiz']) ? $body['quiz'] : null;

if ($name === '' || $phone === '') {
    respond(400, false, 'Name and phone are required');
}

$privateDir = dirname(dirname(__DIR__)) . '/grach-private-data';
if (!ensure_private_dir($privateDir)) {
    respond(500, false, 'Private storage is unavailable');
}

$clientIp = isset($_SERVER['REMOTE_ADDR']) ? (string)$_SERVER['REMOTE_ADDR'] : 'unknown';
if (!rate_limit_allows($privateDir, $clientIp, $consentSecret, 5, 900)) {
    header('Retry-After: 900');
    respond(429, false, 'Too many requests');
}

if (!write_consent_record($privateDir, $phone, $clientIp, $consentSecret, $consentVersion)) {
    respond(500, false, 'Consent record could not be saved');
}

$quizBlock = '';
if ($quiz) {
    $quizBlock =
        "\n\n<b>Результат цифровой консультации</b>\n" .
        "Зона старта: " . escape_html(clean_text(get_body_value($quiz, 'zone') ? get_body_value($quiz, 'zone') : get_body_value($quiz, 'hair'), 120)) . "\n" .
        "Тип волос: " . escape_html(clean_text(get_body_value($quiz, 'hairType') ? get_body_value($quiz, 'hairType') : get_body_value($quiz, 'hair'), 120)) . "\n" .
        "Проблема: " . escape_html(clean_text(get_body_value($quiz, 'pain'), 120)) . "\n" .
        "Приоритет: " . escape_html(clean_text(get_body_value($quiz, 'goal'), 120)) . "\n" .
        "Рекомендация: " . escape_html(clean_text(get_body_value($quiz, 'method'), 120)) . "\n" .
        "Спеццена: " . escape_html(clean_text(get_body_value($quiz, 'offer'), 120));
}

$text =
    "<b>Новая заявка с сайта</b>\n\n" .
    "<b>Имя:</b> " . escape_html($name) . "\n" .
    "<b>Телефон:</b> <a href=\"tel:" . escape_html($phone) . "\">" . escape_html($phone) . "</a>\n" .
    "<b>Согласие:</b> версия " . escape_html($consentVersion) .
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

function env_or_config($key, $config) {
    $value = getenv($key);
    if ($value !== false && $value !== '') {
        return $value;
    }
    return isset($config[$key]) ? $config[$key] : '';
}

function config_flag($key, $config) {
    $value = strtolower(trim((string)env_or_config($key, $config)));
    return in_array($value, array('1', 'true', 'yes', 'on'), true);
}

function get_chat_ids($config) {
    if (isset($config['TELEGRAM_CHAT_IDS']) && is_array($config['TELEGRAM_CHAT_IDS'])) {
        return array_values(array_filter($config['TELEGRAM_CHAT_IDS'], 'strlen'));
    }
    $chatId = env_or_config('TELEGRAM_CHAT_ID', $config);
    return $chatId !== '' ? array($chatId) : array();
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
    foreach (array(
        'CONSULTATION_FORM_ENABLED',
        'CONSENT_LOG_SECRET',
        'TELEGRAM_BOT_TOKEN',
        'TELEGRAM_CHAT_ID',
    ) as $key) {
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

function ensure_private_dir($path) {
    if (is_dir($path)) {
        return true;
    }
    return @mkdir($path, 0700, true) && is_dir($path);
}

function rate_limit_allows($dir, $ip, $secret, $limit, $windowSeconds) {
    $key = hash_hmac('sha256', $ip, $secret);
    $path = $dir . '/rate-' . $key . '.json';
    $handle = @fopen($path, 'c+');
    if (!$handle || !flock($handle, LOCK_EX)) {
        if ($handle) fclose($handle);
        return false;
    }

    $raw = stream_get_contents($handle);
    $events = $raw ? json_decode($raw, true) : array();
    if (!is_array($events)) $events = array();

    $now = time();
    $recent = array();
    foreach ($events as $event) {
        if ((int)$event > $now - $windowSeconds) {
            $recent[] = (int)$event;
        }
    }

    $allowed = count($recent) < $limit;
    if ($allowed) $recent[] = $now;

    rewind($handle);
    ftruncate($handle, 0);
    fwrite($handle, json_encode($recent));
    fflush($handle);
    flock($handle, LOCK_UN);
    fclose($handle);

    return $allowed;
}

function write_consent_record($dir, $phone, $ip, $secret, $version) {
    $userAgent = isset($_SERVER['HTTP_USER_AGENT']) ? (string)$_SERVER['HTTP_USER_AGENT'] : '';
    $record = array(
        'createdAt' => gmdate('c'),
        'source' => 'website_consultation',
        'consentVersion' => $version,
        'phoneHash' => hash_hmac('sha256', $phone, $secret),
        'ipHash' => hash_hmac('sha256', $ip, $secret),
        'userAgentHash' => hash_hmac('sha256', $userAgent, $secret),
    );

    $line = json_encode($record, JSON_UNESCAPED_UNICODE) . "\n";
    return file_put_contents($dir . '/consent-log.ndjson', $line, FILE_APPEND | LOCK_EX) !== false;
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

function clean_text($value, $length) {
    $value = trim((string)$value);
    $value = preg_replace('/[\x00-\x1F\x7F]+/u', ' ', $value);
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
