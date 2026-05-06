import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET Method
export async function GET() {
    try {
    const { data, error } = await supabase.from('skus').select('*');
        if (error) throw error;
        return NextResponse.json(data);
    } catch (error) {
        if (error instanceof Error) {
            console.error('GET Exception:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
    }
}

// POST Method
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { data, error } = await supabase.from('skus').insert(body).select();
        if (error) throw error;
        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        if (error instanceof Error) {
            console.error('POST Exception:', error.message);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
    }
}

// PATCH Method
export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { id, ...updateData } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID is required for update' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('skus')
            .update(updateData)
            .eq('id', id)
            .select();

        if (error) throw error;
        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        if (error instanceof Error) {
            console.error('PATCH Exception:', error.message);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
    }
}

// DELETE Method
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID is required for deletion' }, { status: 400 });
        }

        const { error } = await supabase.from('skus').delete().eq('id', id);
        if (error) throw error;
        return NextResponse.json({ message: 'SKU deleted successfully' }, { status: 200 });
    } catch (error) {
        if (error instanceof Error) {
            console.error('DELETE Exception:', error.message);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
    }
}
