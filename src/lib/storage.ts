import { supabase } from './supabase';

/**
 * Upload a file to Supabase Storage and record metadata
 */
export async function uploadFile(
    bucket: string,
    file: File | Blob,
    fileName: string,
    fileType: 'photo' | 'pdf'
): Promise<{ success: boolean; error?: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const storagePath = `${user.id}/${Date.now()}_${fileName}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(storagePath, file, {
            contentType: file.type || (fileType === 'pdf' ? 'application/pdf' : 'image/jpeg'),
            upsert: false,
        });

    if (uploadError) {
        console.error('Upload error:', uploadError);
        return { success: false, error: uploadError.message };
    }

    // Record metadata
    const { error: dbError } = await supabase.from('files').insert({
        user_id: user.id,
        file_name: fileName,
        file_type: fileType,
        bucket,
        storage_path: storagePath,
        file_size: file.size || 0,
    });

    if (dbError) {
        console.error('DB error:', dbError);
        return { success: false, error: dbError.message };
    }

    return { success: true };
}

/**
 * List files for current user
 */
export async function listFiles(fileType?: 'photo' | 'pdf') {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    let query = supabase
        .from('files')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (fileType) {
        query = query.eq('file_type', fileType);
    }

    const { data, error } = await query;
    if (error) {
        console.error('List files error:', error);
        return [];
    }

    return data || [];
}

/**
 * Get a signed URL for a file
 */
export async function getFileUrl(bucket: string, storagePath: string): Promise<string | null> {
    const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(storagePath, 3600);

    if (error) {
        console.error('Sign URL error:', error);
        return null;
    }

    return data.signedUrl;
}

/**
 * Delete a file
 */
export async function deleteFile(fileId: string, bucket: string, storagePath: string) {
    // Delete from storage
    const { error: storageError } = await supabase.storage
        .from(bucket)
        .remove([storagePath]);

    if (storageError) {
        console.error('Delete storage error:', storageError);
        return { success: false, error: storageError.message };
    }

    // Delete metadata
    const { error: dbError } = await supabase.from('files').delete().eq('id', fileId);
    if (dbError) {
        console.error('Delete db error:', dbError);
        return { success: false, error: dbError.message };
    }

    return { success: true };
}
