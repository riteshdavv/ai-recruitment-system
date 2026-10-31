import React from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const AlertConfirmation = ({ children, stopInterview }) => {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                {children}
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>End Interview Session?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will terminate the voice interview call immediately and generate your evaluation report based on answers provided so far.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Resume Session</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => stopInterview()}
                      className="bg-danger hover:bg-danger/90 text-white"
                    >
                      End Interview
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default AlertConfirmation;
