<?php

namespace App\Http\Controllers\Api\Auth;

use App\Enums\OtpPurpose;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Auth\ResendEmailOtpRequest;
use App\Models\User;
use App\Services\UserOtpService;
use Illuminate\Http\JsonResponse;

class ForgotPasswordController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(ResendEmailOtpRequest $request, UserOtpService $otpService): JsonResponse
    {
        $user = User::where('email', $request->validated('email'))->first();

        if ($user) {
            $otpService->generate($user, OtpPurpose::PasswordReset);
        }

        return response()->json([
            'message' => 'If the email is registered, you will receive a password reset code.',
        ]);
    }
}
