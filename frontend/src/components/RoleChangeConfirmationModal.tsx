import React from 'react';
import { Button, Modal } from 'flowbite-react';

interface RoleChangeConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    userName: string;
    userEmail: string;
    currentRole: string;
    newRole: string;
}

const RoleChangeConfirmationModal: React.FC<RoleChangeConfirmationModalProps> = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    userName, 
    userEmail,
    currentRole, 
    newRole 
}) => {
    return (
        <Modal show={isOpen} onClose={onClose} size="md">
            <Modal.Header>Confirm Role Change</Modal.Header>
            <Modal.Body>
                <div className="space-y-4">
                    <p>
                        Are you sure you want to change the role for:
                    </p>
                    <div className="bg-gray-50 p-3 rounded-lg">
                        <p><strong>User:</strong> {userName || userEmail}</p>
                        <p><strong>Email:</strong> {userEmail}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="text-red-600 font-semibold">{currentRole}</span>
                        <span>→</span>
                        <span className="text-green-600 font-semibold">{newRole}</span>
                    </div>
                    <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400">
                        <p className="text-sm text-yellow-700">
                            <strong>Note:</strong> This will immediately change the user's permissions in the system.
                            {newRole === "Viewer" && " The user will lose admin access and only be able to view data."}
                            {newRole === "Admin" && " The user will gain full administrative privileges."}
                        </p>
                    </div>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button color="gray" onClick={onClose}>
                    Cancel
                </Button>
                <Button 
                    color={newRole === "Admin" ? "blue" : "yellow"} 
                    onClick={onConfirm}
                >
                    Confirm Change to {newRole}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default RoleChangeConfirmationModal;