<?php
/**
 * contact.php — Helma's Décor, LLC Contact Form Mailer
 *
 * Security: POST-only gate, honeypot, input sanitization,
 * header injection prevention, interest whitelist, JSON-only responses.
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/lib/phpmailer/Exception.php';
require_once __DIR__ . '/lib/phpmailer/PHPMailer.php';
require_once __DIR__ . '/lib/phpmailer/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

header('Content-Type: application/json; charset=utf-8');

// POST-only gate
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit;
}

// Honeypot — silent fake-success so bots get no signal
$honeypot = isset($_POST['website']) ? trim($_POST['website']) : '';
if ($honeypot !== '') {
    echo json_encode(['success' => true, 'message' => 'Message sent!']);
    exit;
}

// Sanitization helpers
function sanitize_header(string $v): string {
    return trim(str_replace(["\r", "\n", "\r\n"], '', $v));
}
function sanitize_text(string $v): string {
    return trim(strip_tags($v));
}

// Collect and sanitize
$name     = sanitize_header($_POST['name']     ?? '');
$email    = sanitize_header($_POST['email']    ?? '');
$phone    = sanitize_header($_POST['phone']    ?? '');
$interest = sanitize_header($_POST['interest'] ?? '');
$message  = sanitize_text($_POST['message']    ?? '');

// Validate
$errors = [];

if (empty($name) || mb_strlen($name) > 100)
    $errors[] = 'Please enter your name (max 100 characters).';

if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 254)
    $errors[] = 'Please enter a valid email address.';

if ($phone !== '' && !preg_match('/^[\d\s\+\(\)\-\.ext]{7,25}$/i', $phone))
    $errors[] = 'Phone number contains invalid characters.';

$allowed_interests = ['decorating', 'consultation', 'artwork', 'beach-art', 'signage', 'other'];
if (!in_array($interest, $allowed_interests, true))
    $errors[] = 'Please select a service from the list.';

if (empty($message) || mb_strlen($message) > 5000)
    $errors[] = 'Please enter a message (max 5,000 characters).';

if (!empty($errors)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => implode(' ', $errors)]);
    exit;
}

// Interest label map
$interest_labels = [
    'decorating'   => 'Interior Decorating Services',
    'consultation' => 'Free Consultation',
    'artwork'      => 'Original Artwork / Paintings',
    'beach-art'    => 'Beach Plaques & Coastal Décor',
    'signage'      => 'Custom Commercial Signage',
    'other'        => 'Other / General Inquiry',
];

// Send via PHPMailer
$mail = new PHPMailer(true);

try {
    // SMTP config (from config.php)
    $mail->isSMTP();
    $mail->Host       = MAIL_HOST;
    $mail->SMTPAuth   = true;
    $mail->Username   = MAIL_USERNAME;
    $mail->Password   = MAIL_PASSWORD;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    $mail->Port       = MAIL_PORT;
    $mail->CharSet    = 'UTF-8';

    // Sender & recipient
    $mail->setFrom(MAIL_FROM, MAIL_FROM_NAME);
    $mail->addAddress(MAIL_RECIPIENT);
    $mail->addReplyTo($email, $name); // so Helma can just hit Reply

    // Content
    $mail->isHTML(false);
    $mail->Subject = "New Inquiry from {$name} \u{2014} Helma's D\u{00E9}cor";
    $mail->Body    = "New contact form submission from Helma's Décor website.\n\n"
                   . "Name:     {$name}\n"
                   . "Email:    {$email}\n"
                   . "Phone:    " . ($phone ?: 'Not provided') . "\n"
                   . "Interest: {$interest_labels[$interest]}\n\n"
                   . "Message:\n{$message}\n"
                   . "\n--\nSent via helmasdecor.com contact form";

    $mail->send();

    echo json_encode([
        'success' => true,
        'message' => "Your message was sent! Helma will be in touch within 1\u{2013}2 business days.",
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Sorry, there was a problem sending your message. Please try calling us directly.',
    ]);
}
