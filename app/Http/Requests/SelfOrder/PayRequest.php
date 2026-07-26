<?php

namespace App\Http\Requests\SelfOrder;

use Illuminate\Validation\Rule;

class PayRequest extends StoreRequest
{
    public function rules(): array
    {
        return [
            ...parent::rules(),
            'payment_method' => ['required', Rule::in(['cash', 'online'])],
            'payment_type' => 'required_if:payment_method,online|string|max:50',
        ];
    }

    public function messages(): array
    {
        return [
            ...parent::messages(),
            'payment_method.required' => 'Metode pembayaran wajib dipilih.',
            'payment_type.required_if' => 'Tipe pembayaran wajib dipilih untuk pembayaran online.',
        ];
    }
}
