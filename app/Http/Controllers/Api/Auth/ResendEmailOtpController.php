<?php

namespace App\Http\Controllers\Api\Auth;

use App\Enums\OtpPurpose;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Auth\ResendEmailOtpRequest;
use App\Models\User;
use App\Services\UserOtpService;
use Illuminate\Http\JsonResponse;

class ResendEmailOtpController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(ResendEmailOtpRequest $request, UserOtpService $otpService): JsonResponse
    {
        $user = User::where('email', $request->validated('email'))->first();

        if (! $user || $user->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'If the account requires verification, a new code will be sent.',
            ]);
        }

        $otpService->generate($user, OtpPurpose::EmailVerification);

        return response()->json([
            'message' => 'If the account requires verification, a new code will be sent.',
        ]);
    }
}
