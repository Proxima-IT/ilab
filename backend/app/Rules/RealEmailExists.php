<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class RealEmailExists implements ValidationRule
{
    /**
     * Run the validation rule.
     *
     * @param  \Closure(string): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        // Extract the domain part of the email (e.g., "gmail.com" from "user@gmail.com")
        $domain = substr(strrchr($value, "@"), 1);

        // Query the global DNS to see if this domain has actual Mail Exchange (MX) records
        if (!checkdnsrr($domain, 'MX')) {
            $fail('The provided email domain does not exist or is not configured to receive mail in the real world.');
        }
    }
}