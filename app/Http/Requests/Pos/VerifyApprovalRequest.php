<?php

namespace App\Http\Requests\Pos;

use Illuminate\Foundation\Http\FormRequest;

class VerifyApprovalRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'password' => 'required|string',
        ];
    }
}
