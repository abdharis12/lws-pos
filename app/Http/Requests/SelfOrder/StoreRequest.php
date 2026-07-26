<?php

namespace App\Http\Requests\SelfOrder;

use Illuminate\Foundation\Http\FormRequest;

class StoreRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'customer_name' => 'required|string|max:100',
            'items' => 'required|array|min:1',
            'items.*.menu_id' => 'required|exists:menus,id',
            'items.*.qty' => 'required|integer|min:1',
            'items.*.notes' => 'nullable|string|max:500',
            'items.*.option_ids' => 'nullable|array',
            'items.*.option_ids.*' => 'exists:option_items,id',
        ];
    }

    public function messages(): array
    {
        return [
            'customer_name.required' => 'Nama pelanggan wajib diisi.',
            'customer_name.max' => 'Nama pelanggan maksimal 100 karakter.',
            'items.required' => 'Pesanan tidak boleh kosong.',
            'items.min' => 'Minimal 1 item dalam pesanan.',
            'items.*.menu_id.required' => 'Menu wajib dipilih.',
            'items.*.menu_id.exists' => 'Menu tidak ditemukan.',
            'items.*.qty.required' => 'Jumlah item wajib diisi.',
            'items.*.qty.min' => 'Jumlah item minimal 1.',
            'items.*.notes.max' => 'Catatan maksimal 500 karakter.',
        ];
    }
}
