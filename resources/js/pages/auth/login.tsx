import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasskeyVerify from '@/components/passkey-verify';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

const SAND = '#CFC0A4';
const DARK = '#233433';
const PRIMARY = '#4F6B6A';

type Props = {
    status?: string;
    canResetPassword: boolean;
};

export default function Login({ status, canResetPassword }: Props) {
    return (
        <>
            <Head title="Log in" />

            <PasskeyVerify
                separator="Atau lanjutkan dengan email"
                label="Masuk dengan passkey"
                loadingLabel="Memverifikasi..."
            />

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="email" style={{ color: SAND }}>
                                    Alamat Email
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder="email@example.com"
                                    style={{
                                        backgroundColor: PRIMARY,
                                        borderColor: 'rgba(207, 192, 164, 0.4)',
                                        color: '#FAF8F5',
                                    }}
                                    className="placeholder:text-[#CFC0A4]/60 focus-visible:border-[#CFC0A4] focus-visible:ring-[#CFC0A4]/30"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor="password" style={{ color: SAND }}>
                                        Kata Sandi
                                    </Label>
                                    {canResetPassword && (
                                        <TextLink
                                            href={request()}
                                            className="ml-auto text-sm"
                                            style={{ color: SAND }}
                                            tabIndex={5}
                                        >
                                            Lupa kata sandi?
                                        </TextLink>
                                    )}
                                </div>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder="Kata Sandi"
                                    className="placeholder:text-[#CFC0A4]/60 focus-visible:border-[#CFC0A4] focus-visible:ring-[#CFC0A4]/30"
                                    style={{
                                        backgroundColor: PRIMARY,
                                        borderColor: 'rgba(207, 192, 164, 0.4)',
                                        color: '#FAF8F5',
                                    }}
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="flex items-center space-x-3">
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    tabIndex={3}
                                    style={{
                                        borderColor: SAND,
                                    }}
                                    className="data-[state=checked]:bg-[#CFC0A4] data-[state=checked]:text-[#233433]"
                                />
                                <Label htmlFor="remember" style={{ color: '#FAF8F5' }}>
                                    Ingat saya
                                </Label>
                            </div>

                            <Button
                                type="submit"
                                className="mt-4 w-full font-bold tracking-widest uppercase text-xs"
                                tabIndex={4}
                                disabled={processing}
                                data-test="login-button"
                                style={{
                                    backgroundColor: SAND,
                                    color: DARK,
                                }}
                            >
                                {processing && <Spinner />}
                                Masuk
                            </Button>
                        </div>

                    </>
                )}
            </Form>

            {status && (
                <div className="mb-4 text-center text-sm font-medium" style={{ color: SAND }}>
                    {status}
                </div>
            )}
        </>
    );
}

Login.layout = {
    title: 'Masuk ke Akun Anda',
    description: 'Masukkan email dan kata sandi Anda untuk masuk',
};
