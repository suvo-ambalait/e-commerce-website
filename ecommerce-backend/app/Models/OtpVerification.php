<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OtpVerification extends Model
{
    protected $table = 'otp_verifications';

    protected $fillable = [
        'user_id',
        'otp_code',
        'expires_at',
        'is_verified',
        'verified_at',
        'type',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
