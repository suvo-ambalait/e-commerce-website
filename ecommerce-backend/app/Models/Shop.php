<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Shop extends Model
{
    use HasFactory;
    protected $fillable = [
        'vendor_id',
        'name',
        'email',
        'logo',
        'slug',
        'description',
        'address',
        'phone_number',
        'status',
    ];

    public function vendor()
    {
        return $this->belongsTo(Vendor::class);
    }
}
