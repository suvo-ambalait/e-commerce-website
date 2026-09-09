<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Vendor extends Model
{
    use HasFactory;
    protected $fillable = [
        'user_id',
        'phone_number',
        'nid_number',
        'nid_front_image',
        'nid_back_image',
        'trade_license_number',
        'trade_license_image',
        'bank_account_number',
        'bank_name',
        'bank_branch',
        'reject_reason',
        'approved_at',
        'rejected_at',
        'rejected_by',
        'approved_by',
        'status',
    ];

     protected $casts = [
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function shop()
    {
        return $this->hasMany(Shop::class);
    }
}
