<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class VendorRegisterRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [

            'shope_name' => 'required|string|max:255',
            'shop_email' => 'required|string|email|max:100|unique:users',
            'location' => 'required|string|max:255',
            'tagline' => 'required|string|max:255',
            'about' => 'required|string|max:1000',
        ];
    }
}
