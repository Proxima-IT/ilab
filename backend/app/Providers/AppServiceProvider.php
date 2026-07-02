<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::define('access-admin-panel', function (User $user) {
            return in_array($user->role, [
                'super_admin',
                'admin',
                'manager',
                'instructor',
                'content_manager',
            ], true);
        });

        Gate::define('manage-staff', function (User $user) {
            return $user->role === 'super_admin';
        });

        Gate::define('manage-website-settings', function (User $user) {
            return in_array($user->role, ['super_admin', 'admin'], true);
        });

        Gate::define('manage-reviews', function (User $user) {
            return in_array($user->role, ['super_admin', 'admin', 'manager'], true);
        });

        Gate::define('view-students', function (User $user) {
            return in_array($user->role, ['super_admin', 'admin', 'manager', 'instructor'], true);
        });

        Gate::define('manage-students', function (User $user) {
            return in_array($user->role, ['super_admin', 'admin', 'manager'], true);
        });

        Gate::define('view-instructors', function (User $user) {
            return in_array($user->role, ['super_admin', 'admin', 'manager', 'instructor'], true);
        });

        Gate::define('manage-instructors', function (User $user) {
            return in_array($user->role, ['super_admin', 'admin', 'manager'], true);
        });

        Gate::define('manage-publishing', function (User $user) {
            return in_array($user->role, ['super_admin', 'admin', 'manager', 'content_manager'], true);
        });

        Gate::define('manage-newsletter', function (User $user) {
            return in_array($user->role, ['super_admin', 'admin', 'manager', 'content_manager'], true);
        });

        Gate::define('view-certificates', function (User $user) {
            return in_array($user->role, ['super_admin', 'admin', 'manager', 'instructor'], true);
        });

        Gate::define('manage-certificates', function (User $user) {
            return in_array($user->role, ['super_admin', 'admin', 'manager'], true);
        });

        Gate::define('view-student-progress', function (User $user) {
            return in_array($user->role, ['super_admin', 'admin', 'manager', 'instructor'], true);
        });

        Gate::define('manage-qna', function (User $user) {
            return in_array($user->role, ['super_admin', 'admin', 'manager', 'instructor', 'content_manager'], true);
        });

        Gate::define('view-activity', function (User $user) {
            return $user->role === 'super_admin';
        });

        Gate::define('send-student-notifications', function (User $user) {
            return in_array($user->role, ['super_admin', 'admin', 'manager', 'instructor', 'content_manager'], true);
        });
    }
}
