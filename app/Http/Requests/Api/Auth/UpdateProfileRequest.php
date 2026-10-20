<?php

namespace App\Http\Requests\Api\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $user = $this->user();

        return [
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:255',
            ],

            'username' => [
                'sometimes',
                'required',
                'string',
                'max:50',
                'alpha_dash',
                Rule::unique('users', 'username')->ignore($user),
            ],

            'email' => [
                'sometimes',
                'required',
                'email',
                Rule::unique('users', 'email')->ignore($user),
            ],

            'phone' => [
                'sometimes',
                'required',
                'string',
                'max:20',
                'regex:/^\+?[1-9]\d{7,14}$/',
                Rule::unique('users', 'phone')->ignore($user),
            ],
        ];
    }
}
