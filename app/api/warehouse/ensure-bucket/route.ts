import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      // Return 200 so the app doesn't block; floor plan layout/sections can still save without storage
      return NextResponse.json({
        success: false,
        message: 'Storage bucket setup skipped. Add SUPABASE_SERVICE_ROLE_KEY to .env to enable image uploads.',
        error: 'Supabase credentials not configured',
      });
    }

    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const bucketName = 'warehouse-assets';

    // Check if bucket exists
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return NextResponse.json({
        success: false,
        message: 'Could not check storage buckets. Image upload may not work.',
        error: listError.message,
      });
    }

    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);

    if (bucketExists) {
      return NextResponse.json({
        success: true,
        message: 'Bucket already exists',
        bucket: bucketName
      });
    }

    // Create the bucket
    const { data: newBucket, error: createError } = await supabaseAdmin.storage.createBucket(bucketName, {
      public: true, // Make it public so images can be accessed
      fileSizeLimit: 52428800, // 50MB
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg']
    });

    if (createError) {
      console.error('Error creating bucket:', createError);
      return NextResponse.json({
        success: false,
        message: 'Could not create storage bucket. Create "warehouse-assets" in Supabase Dashboard > Storage if needed.',
        error: createError.message,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Bucket created successfully',
      bucket: newBucket
    });
  } catch (error: any) {
    console.error('Error in ensure-bucket route:', error);
    return NextResponse.json({
      success: false,
      message: 'Storage check failed. Layout and sections can still be saved.',
      error: error?.message || 'Internal server error',
    });
  }
}


