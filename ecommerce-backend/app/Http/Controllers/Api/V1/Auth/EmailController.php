<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\VerifyOtpRequest;
use App\Models\OtpVerification;
use App\Models\User;
use OpenApi\Attributes as OA;

#[OA\Tag(name: 'Email Verification', description: 'Email OTP verification endpoints')]
class EmailController extends Controller {
    #[OA\Post(
        path: '/v1/auth/email/send',
        tags: ['Email Verification'],
        summary: 'Send a verification OTP to the user\'s email',
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['email'],
                properties: [
                    new OA\Property(property: 'email', type: 'string', format: 'email', example: 'john@example.com'),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Verification OTP sent successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string', example: 'OTP sent to email.'),
                    ]
                )
            ),
            new OA\Response(response: 404, description: 'User not found'),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function sendVerificationEmail() {

    }

    #[OA\Post(
        path: '/v1/auth/email/verify',
        tags: ['Email Verification'],
        summary: 'Verify a user\'s email using the OTP sent to it',
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['email', 'otp'],
                properties: [
                    new OA\Property(property: 'email', type: 'string', format: 'email', example: 'john@example.com'),
                    new OA\Property(property: 'otp', type: 'string', minLength: 6, maxLength: 6, example: '123456'),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Email verified successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string', example: 'Email verified successfully.'),
                    ]
                )
            ),
            new OA\Response(response: 400, description: 'Invalid or expired OTP'),
            new OA\Response(response: 404, description: 'User not found'),
            new OA\Response(response: 422, description: 'Validation error'),
            new OA\Response(response: 429, description: 'Maximum verification attempts exceeded'),
        ]
    )]
    public function verifyEmail(VerifyOtpRequest $request) {

        $user = User::where('email', $request->email)->first();

        if(!$user) {
            return response()->json(['message' => 'User not found.'], 404);
        }

        $verification = OtpVerification::where('user_id', $user->id)
            ->where('otp_code', $request->otp)
            ->where('expires_at', '>', now())
            ->first();

        if(!$verification) {
            return response()->json([
                'message' => 'Invalid or expired OTP.'
                ], 400);
        }

        if($verification->attempts >= 5) {
            return response()->json([
                'message' => 'Maximum verification attempts exceeded.'
                ], 429);
        }

        $user->update([
            'email_verified_at' => now(), 
            'status' => 'active'
            ]);

        $verification->update([
            'is_verified' => true, 
            'verified_at' => now()
            ]);
    
        return response()->json([
            'message' => 'Email verified successfully.'
            ]);
    }

    #[OA\Post(
        path: '/v1/auth/email/resend',
        tags: ['Email Verification'],
        summary: 'Resend the verification OTP to the user\'s email',
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['email'],
                properties: [
                    new OA\Property(property: 'email', type: 'string', format: 'email', example: 'john@example.com'),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Verification OTP resent successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string', example: 'OTP resent to email.'),
                    ]
                )
            ),
            new OA\Response(response: 404, description: 'User not found'),
            new OA\Response(response: 422, description: 'Validation error'),
            new OA\Response(response: 429, description: 'Too many resend attempts'),
        ]
    )]
    public function resendVerificationEmail() {

    }
}