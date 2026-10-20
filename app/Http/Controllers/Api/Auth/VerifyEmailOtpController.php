<?php

namespace App\Http\Controllers\Api\Auth;

use App\Enums\OtpPurpose;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Auth\VerifyEmailOtpRequest;
use App\Models\User;
use App\Services\UserOtpService;
use Illuminate\Http\JsonResponse;

class VerifyEmailOtpController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(VerifyEmailOtpRequest $request, UserOtpService $otpService): JsonResponse
    {
        $user = User::where('email', $request->validated('email'))
            ->firstOrFail();

        if ($user->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'Email address is already verified.',
            ]);
        }

        if (! $otpService->verify($user, $request->validated('otp'), OtpPurpose::EmailVerification)) {
            return response()->json([
                'message' => 'Invalid or expired verification code.',
            ], 422);
        }

        $user->markEmailAsVerified();

        $token = $user->createToken('mobile')->plainTextToken;

        return response()->json([
            'message' => 'Email verified successfully.',
            'user' => $user,
            'token' => $token,
            'token_type' => 'Bearer',
        ]);
    }
}
