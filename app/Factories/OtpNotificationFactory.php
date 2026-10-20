<?php

namespace App\Factories;

use App\Enums\OtpPurpose;
use App\Notifications\PasswordResetOtpNotification;
use App\Notifications\VerifyEmailOtpNotification;
use Illuminate\Notifications\Notification;
use LogicException;

class OtpNotificationFactory
{

    public function make(OtpPurpose $purpose, string $otp): Notification
    {
        return match ($purpose) {
            OtpPurpose::EmailVerification => new VerifyEmailOtpNotification($otp),

            OtpPurpose::PasswordReset => new PasswordResetOtpNotification($otp),

            default => throw new LogicException("OTP notification is not implemented for: {$purpose->name}"),
        };
    }
}
