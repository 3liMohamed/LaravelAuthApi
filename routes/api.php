<?php

use App\Http\Controllers\Api\Auth\ForgotPasswordController;
use App\Http\Controllers\Api\Auth\LoginController;
use App\Http\Controllers\Api\Auth\LogoutController;
use App\Http\Controllers\Api\Auth\RegisterController;
use App\Http\Controllers\Api\Auth\ResendEmailOtpController;
use App\Http\Controllers\Api\Auth\ResetPasswordController;
use App\Http\Controllers\Api\Auth\UpdatePasswordController;
use App\Http\Controllers\Api\Auth\UpdateProfileController;
use App\Http\Controllers\Api\Auth\VerifyEmailOtpController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('v1/auth')->group(function () {

    Route::post('/register', RegisterController::class);

    Route::post('/verify-email', VerifyEmailOtpController::class);

    Route::post('/resend-otp', ResendEmailOtpController::class)->middleware('throttle:3,10');

    Route::post('/forgot-password', ForgotPasswordController::class)->middleware('throttle:3,10');

    Route::post('/reset-password', ResetPasswordController::class)->middleware('throttle:5,10');

    Route::post('/login', LoginController::class);

    Route::prefix('account')
        ->middleware('auth:sanctum')
        ->group(function () {

            Route::get('/', function (Request $request) {
                return $request->user();
            });

            Route::patch('/', UpdateProfileController::class);
            Route::patch('/password', UpdatePasswordController::class);
            Route::post('/logout', LogoutController::class);
        });
});
