import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { DiaryContextType } from '../../DiaryLayout';
import { MediaFile } from '../../types';

const PAGE_SIZE = 20;

interface DecryptedAudio extends MediaFile {
    decryptedUrl?: string;
    isDecrypting?: boolean;
    error?: string;
}

const MyStuffAudio: React.FC = () => {
    const { key, session } = useOutletContext<DiaryContextType>();
    const [audios, setAudios] = useState<DecryptedAudio[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(0);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const fetchAudio = useCallback(async (pageIndex: number, order: 'asc' | 'desc') => {
        if (!session?.user?.id) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('media_files')
                .select('*')
                .eq('user_id', session.user.id)
                .eq('file_type', 'audio')
                .order('created_at', { ascending: order === 'asc' })
                .range(pageIndex * PAGE_SIZE, (pageIndex + 1) * PAGE_SIZE - 1);

            if (error) throw error;

            if (data) {
                if (pageIndex === 0) {
                    setAudios(data);
                } else {
                    setAudios(prev => [...prev, ...data]);
                }
                setHasMore(data.length === PAGE_SIZE);
            }
        } catch (error) {
            console.error("Error fetching audio:", error);
        } finally {
            setLoading(false);
        }
    }, [session?.user?.id]);

    useEffect(() => {
        fetchAudio(0, sortOrder);
        setPage(0);
    }, [fetchAudio, sortOrder]);

    const loadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchAudio(nextPage, sortOrder);
    };

    const decryptAudio = async (path: string, index: number) => {
        if (!key) return;

        setAudios(prev => {
            const next = [...prev];
            next[index].isDecrypting = true;
            return next;
        });

        try {
            const { data: signedData, error: signedError } = await supabase.storage
                .from('diary-audio')
                .createSignedUrl(path, 60);

            if (signedError) throw signedError;

            const response = await fetch(signedData.signedUrl);
            if (!response.ok) throw new Error("Failed to fetch audio blob");

            const arrayBuffer = await response.arrayBuffer();
            const view = new DataView(arrayBuffer);

            // Format logic matched from existing layout (metadata length header)
            const metadataLen = view.getUint32(0, true);
            const metadataStr = new TextDecoder().decode(new Uint8Array(arrayBuffer, 4, metadataLen));
            const meta = JSON.parse(metadataStr);

            const iv = Uint8Array.from(atob(meta.iv), c => c.charCodeAt(0));
            const encryptedBytes = arrayBuffer.slice(4 + metadataLen);

            const decryptedBuffer = await window.crypto.subtle.decrypt(
                { name: "AES-GCM", iv },
                key,
                encryptedBytes
            );

            const blob = new Blob([decryptedBuffer], { type: meta.type || 'audio/webm' });
            const url = URL.createObjectURL(blob);

            setAudios(prev => {
                const next = [...prev];
                next[index].decryptedUrl = url;
                next[index].isDecrypting = false;
                return next;
            });

        } catch (err) {
            console.error("Failed to decrypt audio", err);
            setAudios(prev => {
                const next = [...prev];
                next[index].error = "Failed to load";
                next[index].isDecrypting = false;
                return next;
            });
        }
    };

    return (
        <div className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Link to="/app/mystuff" className="p-2 -ml-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">My Audio</h1>
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

            <div className="space-y-4 pb-8">
                {audios.map((audio, idx) => (
                    <div key={audio.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex-1">
                            <div className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                                Uploaded on {new Date(audio.created_at).toLocaleDateString()}
                            </div>

                            {audio.decryptedUrl ? (
                                <audio controls src={audio.decryptedUrl} className="w-full" />
                            ) : (
                                <button
                                    onClick={() => decryptAudio(audio.file_path, idx)}
                                    disabled={audio.isDecrypting}
                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors font-medium text-sm"
                                >
                                    {audio.isDecrypting ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Decrypting...
                                        </>
                                    ) : audio.error ? (
                                        <span className="text-red-500">{audio.error}</span>
                                    ) : (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            Load Audio
                                        </>
                                    )}
                                </button>
                            )}
                        </div>

                        <div className="flex justify-end border-t border-slate-100 dark:border-slate-700 pt-3 md:pt-0 md:border-t-0 md:border-l md:pl-4">
                            <Link
                                to={`/app/entry/${audio.entry_id}`}
                                className="text-sm text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1"
                            >
                                View Entry
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                            </Link>
                        </div>
                    </div>
                ))}
            </div>

            {loading && (
                <div className="py-4 text-center text-slate-500">Loading...</div>
            )}

            {!loading && hasMore && audios.length > 0 && (
                <div className="py-4 text-center">
                    <button
                        onClick={loadMore}
                        className="px-6 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors font-medium"
                    >
                        Load More
                    </button>
                </div>
            )}

            {!loading && audios.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                    No audio recordings found.
                </div>
            )}
        </div>
    );
};

export default MyStuffAudio;
