import { Form, Head, usePage } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import { User, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { edit } from '@/routes/profile';
import { send } from '@/routes/verification';
import type { Auth } from '@/types';

type PageProps = {
    auth: Auth;
};

const BORDER = 'rgba(37,51,47,0.08)';

export default function Profile({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { auth } = usePage<PageProps>().props;

    return (
        <>
            <Head title="Profile settings" />

            <h1 className="sr-only">Profile settings</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Profile"
                    description="Update your name and email address"
                />

                <Card className="group relative overflow-hidden border-[#CFC0A4]/40 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#4F6B6A]/10">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#4F6B6A] to-[#CFC0A4]" />

                    <CardHeader className="flex flex-row items-start justify-between pt-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#4F6B6A]/10">
                                <User className="h-4.5 w-4.5 text-[#4F6B6A]" strokeWidth={2} />
                            </div>
                            <div>
                                <CardTitle className="text-[15px] font-semibold tracking-[0.12em] text-[#4F6B6A]/70 uppercase">
                                    Profile Information
                                </CardTitle>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-6 pt-2">
                        <Form
                            {...ProfileController.update.form()}
                            options={{
                                preserveScroll: true,
                            }}
                            className="space-y-6"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="name" className="text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                                            Full Name
                                        </Label>

                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                                            <Input
                                                id="name"
                                                className="mt-1 block w-full pl-10 h-11 border-2 text-base font-medium shadow-sm transition-all focus:border-emerald-500 focus:ring-emerald-500"
                                                style={{ borderColor: BORDER }}
                                                defaultValue={auth.user.name}
                                                name="name"
                                                required
                                                autoComplete="name"
                                                placeholder="Full name"
                                            />
                                        </div>

                                        <InputError
                                            className="mt-2"
                                            message={errors.name}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="email" className="text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                                            Email Address
                                        </Label>

                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                                            <Input
                                                id="email"
                                                type="email"
                                                className="mt-1 block w-full pl-10 h-11 border-2 text-base font-medium shadow-sm transition-all focus:border-emerald-500 focus:ring-emerald-500"
                                                style={{ borderColor: BORDER }}
                                                defaultValue={auth.user.email}
                                                name="email"
                                                required
                                                autoComplete="username"
                                                placeholder="Email address"
                                            />
                                        </div>

                                        <InputError
                                            className="mt-2"
                                            message={errors.email}
                                        />
                                    </div>

                                    {mustVerifyEmail &&
                                        auth.user.email_verified_at === null && (
                                            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100">
                                                    <AlertCircle className="size-4 text-amber-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm text-amber-800">
                                                        Your email address is unverified.{' '}
                                                        <Link
                                                            href={send()}
                                                            as="button"
                                                            className="font-medium underline decoration-amber-300 underline-offset-2 transition-colors hover:decoration-current"
                                                        >
                                                            Click here to re-send the
                                                            verification email.
                                                        </Link>
                                                    </p>

                                                    {status ===
                                                        'verification-link-sent' && (
                                                            <div className="mt-2 flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                                                                <CheckCircle2 className="size-4" />
                                                                A new verification link has been
                                                                sent to your email address.
                                                            </div>
                                                        )}
                                                </div>
                                            </div>
                                        )}

                                    <Separator className="my-2" style={{ borderColor: BORDER }} />

                                    <div className="flex items-center gap-4">
                                        <Button
                                            disabled={processing}
                                            data-test="update-profile-button"
                                            className="gap-2 font-serif font-semibold text-white shadow-lg shadow-emerald-900/20 transition-all hover:scale-[1.02]"
                                            style={{ backgroundColor: '#4F6B6A' }}
                                        >
                                            <CheckCircle2 className="size-4" />
                                            Save Changes
                                        </Button>
                                    </div>
                                </>
                            )}
                        </Form>
                    </CardContent>
                </Card>

                <DeleteUser />
            </div>
        </>
    );
}

Profile.layout = {
    breadcrumbs: [
        {
            title: 'Profile settings',
            href: edit(),
        },
    ],
};
