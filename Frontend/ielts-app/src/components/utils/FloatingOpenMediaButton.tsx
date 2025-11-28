import { useState } from "react";
import MediaListModal from "../test_rework/MediaListModal";

function FloatingOpenMediaButton() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // might use if want to copy media on img click
    const handleSelectMedia = (mediaUrl: string) => {
        console.log("Selected media URL:", mediaUrl);
    };

    return (
        <>
            {/* Floating Button */}
            <button
                className="btn btn-primary rounded-circle shadow-lg"
                style={{
                    position: 'fixed',
                    bottom: '2rem',
                    right: '2rem',
                    width: '60px',
                    height: '60px',
                    zIndex: 3000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
                onClick={() => setIsModalOpen(true)}
                title="Open Media Library"
            >
                <i className="isax isax-gallery" style={{ fontSize: '24px' }}></i>
            </button>

            {/* Media List Modal */}
            <MediaListModal
                isOpen={isModalOpen}
                // onSelectMedia={handleSelectMedia}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    );
}

export default FloatingOpenMediaButton;
