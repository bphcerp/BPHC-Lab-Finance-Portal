import { Modal } from "flowbite-react";
import { FunctionComponent } from "react";
import { Link } from "react-router-dom";

interface DocumentModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
}

const DocumentModal: FunctionComponent<DocumentModalProps> = ({ isOpen, onClose, projectId }) => {
    const fetchDocumentUrl = (url: string) => {
        return `${import.meta.env.VITE_BACKEND_URL}${url}`;
    };

    return (
        <Modal show={isOpen} onClose={onClose}>
            <Modal.Header>Documents</Modal.Header>
            <Modal.Body>
                <div className="flex flex-col space-y-4">
                    <div className="flex justify-between items-center">
                        <span>Sanction Letter</span>
                        <Link
                            to={fetchDocumentUrl(`/project/${projectId}/sanction_letter`)} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-blue-600 hover:underline"
                        >
                            View
                        </Link>
                    </div>
                    <div className="flex justify-between items-center">
                        <span>Utilization Certificate</span>
                        <Link 
                            to={fetchDocumentUrl(`/project/${projectId}/util_cert`)} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-blue-600 hover:underline"
                        >
                            View
                        </Link>
                    </div>
                </div>
            </Modal.Body>
        </Modal>
    );
};

export default DocumentModal;