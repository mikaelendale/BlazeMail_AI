import { useForm } from '@inertiajs/react';
import { FormEventHandler, useRef, useState } from 'react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import HeadingSmall from '@/components/heading-small';

import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { usePage } from '@inertiajs/react';
import { SharedData } from '@/types';

export default function DeleteUserForm() {
    const { props } = usePage();
    const { auth } = usePage<SharedData>().props; 

    const passwordInput = useRef<HTMLInputElement>(null);
    const [showNameInput, setShowNameInput] = useState(auth.user.provider_name !== null);
    const { data, setData, delete:destroy, processing, reset, errors, clearErrors } = useForm<Required<{ password: string; name: string }>>({
        password: '',
        name: '',
    });

    const deleteUser: FormEventHandler = (e) => {
        e.preventDefault();

        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current?.focus(),
            onFinish: () => reset(),
        });
    };


    const closeModal = () => {
        clearErrors();
        reset();
        setShowNameInput(auth.user.provider_name !== null && auth.user.password === null);
    };

    return (
        <div className="space-y-6">
            <HeadingSmall title="Delete account" description="Delete your account and all of its resources" />
            <div className="space-y-4 rounded-lg border border-red-100 bg-red-50 p-4 dark:border-red-200/10 dark:bg-red-700/10">
                <div className="relative space-y-0.5 text-red-600 dark:text-red-100">
                    <p className="font-medium">Warning</p>
                    <p className="text-sm">Please proceed with caution, this cannot be undone.</p>
                </div>

                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="destructive">Delete account</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogTitle>Are you sure you want to delete your account?</DialogTitle>
                        <DialogDescription>
                            Once your account is deleted, all of its resources and data will also be permanently deleted. <br/> Please enter your{' '}
                            <strong>{showNameInput ? 'name' : 'password'}</strong> to confirm you would like to permanently delete your account.
                        </DialogDescription>
                        <form className="space-y-6" onSubmit={deleteUser}>
                            {showNameInput ? (
                                <div className="grid gap-2">
                                    <Label htmlFor="name" className="sr-only">
                                        Name
                                    </Label>

                                    <Input
                                        id="name"
                                        type="text"
                                        name="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="Your Name"
                                        autoComplete="name"
                                    />

                                    <InputError message={errors.name} />
                                </div>
                            ) : (
                                <div className="grid gap-2">
                                    <Label htmlFor="password" className="sr-only">
                                        Password
                                    </Label>

                                    <Input
                                        id="password"
                                        type="password"
                                        name="password"
                                        ref={passwordInput}
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder="Password"
                                        autoComplete="current-password"
                                    />

                                    <InputError message={errors.password} />
                                </div>
                            )}

                            <DialogFooter className="gap-2">
                                <DialogClose asChild>
                                    <Button variant="secondary" onClick={closeModal}>
                                        Cancel
                                    </Button>
                                </DialogClose>

                                <Button variant="destructive" disabled={processing} asChild>
                                    <button type="submit">Delete account</button>
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
