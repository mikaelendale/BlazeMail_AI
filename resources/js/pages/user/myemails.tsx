import MyEmailsComponent from '@/components/my-emails';
import AppLayout from '@/layouts/app-layout';
import React from 'react';

export default function MyEmails({ myEmails, links}) {
    return (
        <AppLayout>
            <MyEmailsComponent myEmails={myEmails} links={links}/>
        </AppLayout>
    );
};

