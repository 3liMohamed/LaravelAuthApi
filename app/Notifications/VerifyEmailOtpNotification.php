<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class VerifyEmailOtpNotification extends Notification
{

    public function __construct(public string $otp) {}


    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Verify Your Email Address')
            ->greeting('Hello!')
            ->line('Your email verification code is:')
            ->line($this->otp)
            ->line('This code expires in 10 minutes.')
            ->line('If you did not create this account, you can ignore this email.');
    }


}
