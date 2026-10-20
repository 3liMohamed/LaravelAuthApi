<?php

namespace App\Http\Controllers\Api\Auth;

use App\Enums\OtpPurpose;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Auth\ResetPasswordRequest;
use App\Models\User;
use App\Services\UserOtpService;

class ResetPasswordController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(ResetPasswordRequest $request, UserOtpService $otpService)
    {
        $user = User::where('email', $request->validated('email'))->first();

        if (! $user) {
            return response()->json([
                'message' => 'Invalid or expired password reset code.',
            ], 422);
        }

        $verified = $otpService->verify($user, $request->validated('otp'), OtpPurpose::PasswordReset);

        if (! $verified) {
            return response()->json([
                'message' => 'Invalid or expired password reset code.',
            ], 422);
        }

        $user->update(['password' => $request->validated('password')]);

        return response()->json([
            'message' => 'Password reset successfully.',
        ]);
    }
}
