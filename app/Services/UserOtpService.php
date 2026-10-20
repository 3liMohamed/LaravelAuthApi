<?php

namespace App\Services;

use App\Enums\OtpPurpose;
use App\Factories\OtpNotificationFactory;
use App\Models\User;
use App\Models\UserOtp;
use Illuminate\Support\Facades\Hash;

class UserOtpService
{
    public function __construct(
        private OtpNotificationFactory $notificationFactory,
    ) {}
    public function generate(User $user, OtpPurpose $purpose): void
    {
        $otp = (string) random_int(100000, 999999);

        UserOtp::updateOrCreate(
            ['user_id' => $user->id, 'purpose' => $purpose],
            [
                'code_hash' => Hash::make($otp),
                'expires_at' => now()->addMinutes(10),
                'attempts' => 0,
            ]
        );
        $notification = $this->notificationFactory->make($purpose, $otp);
        $user->notify($notification);
    }

    public function verify(User $user, string $otp, OtpPurpose $purpose): bool
    {
        $record = UserOtp::where('user_id', $user->id)
            ->where('purpose', $purpose)
            ->first();

        if (! $record) {
            return false;
        }

        if ($record->expires_at->isPast() || $record->attempts >= 5) {
            $record->delete();

            return false;
        }

        if (! Hash::check($otp, $record->code_hash)) {
            $record->increment('attempts');

            return false;
        }

        $record->delete();

        return true;
    }
}
