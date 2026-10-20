<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PasswordResetOtpNotification extends Notification
{

    public function __construct(public string $otp) {}


    public function via(object $notifiable): array
    {
        return ['mail'];
    }


    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Password Reset Code')
            ->greeting('Hello!')
            ->line('You requested to reset your password.')
            ->line("Your verification code is: {$this->otp}")
            ->line('This code expires in 10 minutes.')
            ->line('If you did not request a password reset, please ignore this email.');
    }


}
