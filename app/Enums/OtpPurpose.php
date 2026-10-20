<?php

namespace App\Enums;

enum OtpPurpose: int
{
    case EmailVerification = 1;
    case PasswordReset = 2;
    case PhoneVerification = 3;
}
