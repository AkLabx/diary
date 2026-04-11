import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { DiaryContextType } from '../../DiaryLayout';
import { MediaFile } from '../../types';
import Lightbox from '../../components/Lightbox';

const PAGE_SIZE = 20;

interface DecryptedImage extends MediaFile {
    decryptedUrl?: string;
    isDecrypting?: boolean;
    error?: string;
}

const MyStuffImages: React.FC = () => {
    const { key, session } = useOutletContext<DiaryContextType>();
    const [images, setImages] = useState<DecryptedImage[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(0);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxUrl, setLightboxUrl] = useState('');


    const fetchImages = useCallback(async (pageIndex: number, order: 'asc' | 'desc') => {
        if (!session?.user?.id) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('media_files')
                .select('*', { count: 'exact' })
                .eq('user_id', session.user.id)
                .eq('file_type', 'image')
                .order('created_at', { ascending: order === 'asc' })
                .range(pageIndex * PAGE_SIZE, (pageIndex + 1) * PAGE_SIZE - 1);

            if (error) throw error;

            if (data) {
                if (pageIndex === 0) {
                    setImages(data);
                } else {
                    setImages(prev => [...prev, ...data]);
                }
                setHasMore(data.length === PAGE_SIZE);
            }
        } catch (error) {
            console.error("Error fetching images:", error);
        } finally {
            setLoading(false);
        }
    }, [session?.user?.id]);

    useEffect(() => {
        fetchImages(0, sortOrder);
        setPage(0);
    }, [fetchImages, sortOrder]);

    const loadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchImages(nextPage, sortOrder);
    };

    // Helper to extract IV from the standard format 'iv:encryptedData'
    const decryptImage = async (path: string, index: number) => {
        if (!key) return;

        setImages(prev => {
            const next = [...prev];
            next[index].isDecrypting = true;
            return next;
        });

        try {
            // Re-fetch the entry to get the exact IV from the securely-stored html content.
            // Since we extracted only paths to 'media_files' previously, we must find the IV.
            // This requires scanning the decrypted entries, or fetching from DB if needed.
            // Wait, we don't have the IV in media_files. We MUST add IV to media_files or extract it.
            // Since the user is stuck NOW, let's parse it from the entry's decrypted content.

            const { data: diaryData, error: diaryError } = await supabase
                .from('diaries')
                .select('encrypted_entry, iv')
                .eq('id', images[index].entry_id)
                .single();

            if (diaryError) throw diaryError;

            const { decrypt, decryptBinary } = await import('../../lib/crypto');
            const decryptedEntry = await decrypt(key, diaryData.encrypted_entry, diaryData.iv);
            const { content } = JSON.parse(decryptedEntry);

            // find the metadata for this path
            const parser = new DOMParser();
            const doc = parser.parseFromString(content, 'text/html');
            const imgElements = doc.querySelectorAll('img.secure-diary-image');

            let matchedIv = '';
            imgElements.forEach(img => {
                const element = img as HTMLImageElement;
                const metaStr = element.getAttribute('data-secure-metadata') || element.getAttribute('alt');
                if (metaStr) {
                    try {
                        const meta = JSON.parse(metaStr);
                        if (meta.path === path) {
                            matchedIv = meta.iv;
                        }
                    } catch (e) {}
                }
            });

            if (!matchedIv) throw new Error("Could not find IV for image");

            const { data: signedData, error: signedError } = await supabase.storage
                .from('diary-images')
                .createSignedUrl(path, 60);

            if (signedError) throw signedError;

            const response = await fetch(signedData.signedUrl);
            if (!response.ok) throw new Error("Failed to fetch image blob");

            const encryptedBuffer = await response.arrayBuffer();
            const decryptedBuffer = await decryptBinary(key, encryptedBuffer, matchedIv);

            const blob = new Blob([decryptedBuffer], { type: 'image/webp' });
            const url = URL.createObjectURL(blob);

            setImages(prev => {
                const next = [...prev];
                next[index].decryptedUrl = url;
                next[index].isDecrypting = false;
                return next;
            });

        } catch (err) {
            console.error("Failed to decrypt image", err);
            setImages(prev => {
                const next = [...prev];
                next[index].error = "Failed to load";
                next[index].isDecrypting = false;
                return next;
            });
        }
    };

    const handleImageClick = (img: DecryptedImage, index: number) => {
        if (img.decryptedUrl) {
            setLightboxUrl(img.decryptedUrl);

            setLightboxOpen(true);
        } else if (!img.isDecrypting) {
            decryptImage(img.file_path, index);
        }
    };

    return (
        <div className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Link to="/app/mystuff" className="p-2 -ml-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">My Images</h1>
                </div>
                <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="desc">Newest First</option>
                    <option value="asc">Oldest First</option>
                </select>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-8">
                {images.map((img, idx) => (
                    <div
                        key={img.id}
                        className="aspect-square bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden cursor-pointer relative group border border-slate-200 dark:border-slate-700"
                        onClick={() => handleImageClick(img, idx)}
                    >
                        {img.decryptedUrl ? (
                            <img src={img.decryptedUrl} alt="Diary" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                                {img.isDecrypting ? (
                                    <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : img.error ? (
                                    <span className="text-red-500 text-sm">{img.error}</span>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        <span className="text-sm font-medium">Click to Load</span>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Go to entry link overlay */}
                        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <Link
                                to={`/app/entry/${img.entry_id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg backdrop-blur-sm"
                                title="Go to entry"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                            </Link>
                        </div>
                    </div>
                ))}
            </div>

            {loading && (
                <div className="py-4 text-center text-slate-500">Loading...</div>
            )}

            {!loading && hasMore && (
                <div className="py-4 text-center">
                    <button
                        onClick={loadMore}
                        className="px-6 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors font-medium"
                    >
                        Load More
                    </button>
                </div>
            )}

            {!loading && images.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                    No images found.
                </div>
            )}

            <Lightbox
                src={lightboxOpen ? lightboxUrl : null}
                onClose={() => setLightboxOpen(false)}
            />
        </div>
    );
};

export default MyStuffImages;
