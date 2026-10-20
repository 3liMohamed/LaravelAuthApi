<?php

namespace App\Http\Controllers\Api\Auth;

use App\Enums\OtpPurpose;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Auth\RegisterRequest;
use App\Models\User;
use App\Services\UserOtpService;
use Illuminate\Http\JsonResponse;

class RegisterController extends Controller
{
    public function __invoke(RegisterRequest $request, UserOtpService $otpService): JsonResponse
    {
        $user = User::create(
            $request->safe()->only([
                'name',
                'username',
                'email',
                'phone',
                'password',
            ])
        );

        $otpService->generate($user, OtpPurpose::EmailVerification);

        return response()->json([
            'message' => 'Account created successfully. Please check your email for the verification code.',
            'email' => $user->email,
        ], 201);

        // $token = $user->createToken('mobile')->plainTextToken;

        // return response()->json([
        //     'message' => 'Account created successfully.',
        //     'user' => $user,
        //     'token' => $token,
        //     'token_type' => 'Bearer',
        // ], 201);
    }
}
