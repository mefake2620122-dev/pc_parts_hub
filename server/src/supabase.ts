import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(supabaseUrl && supabaseKey && supabaseUrl.startsWith('http'));
};

let clientInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!clientInstance) {
    clientInstance = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return clientInstance;
}

// ── Supabase Data Access Service ───────────────────────────────────────────

export const supabaseService = {
  // 1. Settings
  async getSettings(): Promise<Record<string, string>> {
    const client = getSupabase();
    if (!client) return {};
    const { data, error } = await client.from('site_settings').select('key, value');
    if (error || !data) return {};
    const settings: Record<string, string> = {};
    for (const item of data) {
      settings[item.key] = item.value;
    }
    return settings;
  },

  async updateSettings(settings: Record<string, any>): Promise<boolean> {
    const client = getSupabase();
    if (!client) return false;
    const entries = Object.entries(settings)
      .filter(([_, val]) => typeof val === 'string' || typeof val === 'number')
      .map(([key, val]) => ({
        key,
        value: String(val),
        updated_at: new Date().toISOString(),
      }));

    if (entries.length === 0) return true;
    const { error } = await client.from('site_settings').upsert(entries, { onConflict: 'key' });
    return !error;
  },

  // 2. Categories
  async getCategories(): Promise<any[]> {
    const client = getSupabase();
    if (!client) return [];

    const [catRes, prodRes] = await Promise.all([
      client.from('categories').select('*').eq('is_active', 1).order('sort_order', { ascending: true }).order('name', { ascending: true }),
      client.from('products').select('category_id, stock_status')
    ]);

    if (catRes.error || !catRes.data) return [];

    const products = prodRes.data || [];
    return catRes.data.map((cat: any) => {
      const catProds = products.filter((p: any) => p.category_id === cat.id);
      const total_products = catProds.length;
      const in_stock_count = catProds.filter((p: any) => p.stock_status === 'IN_STOCK').length;
      return {
        ...cat,
        total_products,
        in_stock_count
      };
    });
  },

  async createCategory(cat: { name: string; slug: string; icon?: string; description?: string; sort_order?: number; image?: string }): Promise<any> {
    const client = getSupabase();
    if (!client) return null;
    const { data, error } = await client.from('categories').insert([cat]).select('id, slug').single();
    if (error) throw error;
    return data;
  },

  async updateCategory(id: number, cat: any): Promise<boolean> {
    const client = getSupabase();
    if (!client) return false;
    const { error } = await client.from('categories').update(cat).eq('id', id);
    return !error;
  },

  async deleteCategory(id: number): Promise<{ success: boolean; productCount?: number }> {
    const client = getSupabase();
    if (!client) return { success: false };
    const { count } = await client.from('products').select('id', { count: 'exact', head: true }).eq('category_id', id);
    if (count && count > 0) {
      return { success: false, productCount: count };
    }
    const { error } = await client.from('categories').delete().eq('id', id);
    return { success: !error };
  },

  // 3. Products
  async getProducts(params: {
    q?: string;
    category?: string;
    brand?: string;
    condition?: string;
    stock_status?: string;
    min_price?: number;
    max_price?: number;
    featured?: boolean;
    new_arrival?: boolean;
    sort?: string;
    limit?: number;
    page?: number;
  }): Promise<{ products: any[]; page: number; limit: number; count: number }> {
    const client = getSupabase();
    if (!client) return { products: [], page: 1, limit: 50, count: 0 };

    let query = client
      .from('products')
      .select('*, categories!inner(name, slug), product_images(image_url, is_primary, sort_order)');

    if (params.category && params.category !== 'all') {
      query = query.eq('categories.slug', params.category);
    }
    if (params.brand && params.brand !== 'all') {
      query = query.eq('brand', params.brand);
    }
    if (params.condition && params.condition !== 'all') {
      query = query.eq('condition', params.condition);
    }
    if (params.stock_status && params.stock_status !== 'all') {
      query = query.eq('stock_status', params.stock_status);
    }
    if (params.min_price !== undefined) {
      query = query.gte('price', params.min_price);
    }
    if (params.max_price !== undefined) {
      query = query.lte('price', params.max_price);
    }
    if (params.featured) {
      query = query.eq('is_featured', 1);
    }
    if (params.new_arrival) {
      query = query.eq('is_new_arrival', 1);
    }

    // Full text token search
    if (params.q && params.q.trim()) {
      const tokens = params.q.trim().split(/\s+/).filter(Boolean);
      for (const token of tokens) {
        query = query.or(`name.ilike.%${token}%,brand.ilike.%${token}%,model.ilike.%${token}%,product_code.ilike.%${token}%,description.ilike.%${token}%`);
      }
    }

    // Sorting
    switch (params.sort) {
      case 'price_asc':
        query = query.order('price', { ascending: true });
        break;
      case 'price_desc':
        query = query.order('price', { ascending: false });
        break;
      case 'name':
        query = query.order('name', { ascending: true });
        break;
      case 'newest':
      default:
        query = query.order('id', { ascending: false });
        break;
    }

    const limit = Math.max(1, Math.min(100, Number(params.limit || 50)));
    const page = Math.max(1, Number(params.page || 1));
    const offset = (page - 1) * limit;

    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;
    if (error || !data) return { products: [], page, limit, count: 0 };

    const enriched = data.map((p: any) => {
      const primaryImg = p.product_images?.find((img: any) => img.is_primary === 1) || p.product_images?.[0];
      let specs = {};
      try {
        specs = typeof p.specifications === 'string' ? JSON.parse(p.specifications) : (p.specifications || {});
      } catch {}

      return {
        ...p,
        category_name: p.categories?.name,
        category_slug: p.categories?.slug,
        specifications: specs,
        primary_image: primaryImg?.image_url || 'https://placehold.co/800x600/12151e/ffffff?text=PC+Part',
        product_images: undefined,
        categories: undefined
      };
    });

    return {
      products: enriched,
      page,
      limit,
      count: enriched.length
    };
  },

  async getFilters(): Promise<{ brands: string[]; conditions: string[]; min_price: number; max_price: number }> {
    const client = getSupabase();
    if (!client) return { brands: [], conditions: [], min_price: 0, max_price: 100000 };

    const { data } = await client.from('products').select('brand, condition, price');
    if (!data || data.length === 0) {
      return { brands: [], conditions: [], min_price: 0, max_price: 100000 };
    }

    const brands = Array.from(new Set(data.map((p: any) => p.brand).filter(Boolean))).sort();
    const conditions = Array.from(new Set(data.map((p: any) => p.condition).filter(Boolean))).sort();
    const prices = data.map((p: any) => Number(p.price)).filter((n: number) => !isNaN(n));
    const min_price = prices.length ? Math.min(...prices) : 0;
    const max_price = prices.length ? Math.max(...prices) : 100000;

    return { brands, conditions, min_price, max_price };
  },

  async getProduct(identifier: string | number): Promise<any | null> {
    const client = getSupabase();
    if (!client) return null;

    const isNum = !isNaN(Number(identifier));
    let query = client.from('products').select('*, categories(name, slug), product_images(id, image_url, is_primary, sort_order)');
    if (isNum) {
      query = query.or(`id.eq.${identifier},slug.eq.${identifier}`);
    } else {
      query = query.eq('slug', identifier);
    }

    const { data, error } = await query.limit(1).maybeSingle();
    if (error || !data) return null;

    let specs = {};
    try {
      specs = typeof data.specifications === 'string' ? JSON.parse(data.specifications) : (data.specifications || {});
    } catch {}

    const images = (data.product_images || []).sort((a: any, b: any) => (b.is_primary || 0) - (a.is_primary || 0));

    return {
      ...data,
      category_name: data.categories?.name,
      category_slug: data.categories?.slug,
      specifications: specs,
      images: images.length ? images : [{ id: 0, image_url: 'https://placehold.co/800x600/12151e/ffffff?text=PC+Part', is_primary: 1 }],
      product_images: undefined,
      categories: undefined
    };
  },

  async createProduct(productData: any, images: string[] = []): Promise<any> {
    const client = getSupabase();
    if (!client) throw new Error('Supabase not configured');

    const { data, error } = await client.from('products').insert([productData]).select('id, slug, product_code').single();
    if (error) throw error;

    if (images.length > 0) {
      const imgRecords = images.map((url, idx) => ({
        product_id: data.id,
        image_url: url,
        is_primary: idx === 0 ? 1 : 0,
        sort_order: idx
      }));
      await client.from('product_images').insert(imgRecords);
    }

    return data;
  },

  async updateProduct(id: number, productData: any, images?: string[]): Promise<boolean> {
    const client = getSupabase();
    if (!client) return false;

    const { error } = await client.from('products').update({ ...productData, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) return false;

    if (Array.isArray(images)) {
      await client.from('product_images').delete().eq('product_id', id);
      if (images.length > 0) {
        const imgRecords = images.map((url, idx) => ({
          product_id: id,
          image_url: url,
          is_primary: idx === 0 ? 1 : 0,
          sort_order: idx
        }));
        await client.from('product_images').insert(imgRecords);
      }
    }

    return true;
  },

  async updateStock(id: number, stock_status: string): Promise<boolean> {
    const client = getSupabase();
    if (!client) return false;
    const { error } = await client.from('products').update({ stock_status, updated_at: new Date().toISOString() }).eq('id', id);
    return !error;
  },

  async deleteProduct(id: number): Promise<boolean> {
    const client = getSupabase();
    if (!client) return false;
    await client.from('product_images').delete().eq('product_id', id);
    const { error } = await client.from('products').delete().eq('id', id);
    return !error;
  },

  // 4. Combos
  async getCombos(): Promise<any[]> {
    const client = getSupabase();
    if (!client) return [];

    const { data: combos, error } = await client.from('combos').select('*').order('is_featured', { ascending: false }).order('id', { ascending: false });
    if (error || !combos) return [];

    const { data: items } = await client.from('combo_items').select('*, products(name, price, slug, stock_status)');
    const allItems = items || [];

    return combos.map((c: any) => ({
      ...c,
      items: allItems.filter((it: any) => it.combo_id === c.id).map((it: any) => ({
        id: it.id,
        custom_label: it.custom_label,
        product_id: it.product_id,
        product_name: it.products?.name,
        product_price: it.products?.price,
        product_slug: it.products?.slug,
        stock_status: it.products?.stock_status
      }))
    }));
  },

  async getCombo(identifier: string | number): Promise<any | null> {
    const client = getSupabase();
    if (!client) return null;

    const isNum = !isNaN(Number(identifier));
    let query = client.from('combos').select('*');
    if (isNum) {
      query = query.or(`id.eq.${identifier},slug.eq.${identifier}`);
    } else {
      query = query.eq('slug', identifier);
    }

    const { data: combo, error } = await query.limit(1).maybeSingle();
    if (error || !combo) return null;

    const { data: items } = await client
      .from('combo_items')
      .select('*, products(name, price, slug, stock_status)')
      .eq('combo_id', combo.id);

    return {
      ...combo,
      items: (items || []).map((it: any) => ({
        id: it.id,
        custom_label: it.custom_label,
        product_id: it.product_id,
        product_name: it.products?.name,
        product_price: it.products?.price,
        product_slug: it.products?.slug,
        stock_status: it.products?.stock_status
      }))
    };
  },

  async createCombo(comboData: any, items: any[] = []): Promise<any> {
    const client = getSupabase();
    if (!client) throw new Error('Supabase not configured');

    const { data, error } = await client.from('combos').insert([comboData]).select('id, slug').single();
    if (error) throw error;

    if (Array.isArray(items) && items.length > 0) {
      const itemRecords = items.map((it: any) => {
        if (typeof it === 'string') {
          return { combo_id: data.id, product_id: null, custom_label: it };
        }
        return { combo_id: data.id, product_id: it.product_id || null, custom_label: it.custom_label || it.name || '' };
      });
      await client.from('combo_items').insert(itemRecords);
    }

    return data;
  },

  async updateCombo(id: number, comboData: any, items?: any[]): Promise<boolean> {
    const client = getSupabase();
    if (!client) return false;

    const { error } = await client.from('combos').update(comboData).eq('id', id);
    if (error) return false;

    if (Array.isArray(items)) {
      await client.from('combo_items').delete().eq('combo_id', id);
      if (items.length > 0) {
        const itemRecords = items.map((it: any) => {
          if (typeof it === 'string') {
            return { combo_id: id, product_id: null, custom_label: it };
          }
          return { combo_id: id, product_id: it.product_id || null, custom_label: it.custom_label || it.name || '' };
        });
        await client.from('combo_items').insert(itemRecords);
      }
    }

    return true;
  },

  async deleteCombo(id: number): Promise<boolean> {
    const client = getSupabase();
    if (!client) return false;
    await client.from('combo_items').delete().eq('combo_id', id);
    const { error } = await client.from('combos').delete().eq('id', id);
    return !error;
  },

  // 5. Auth
  async getAdminByUsername(username: string): Promise<any | null> {
    const client = getSupabase();
    if (!client) return null;
    const { data } = await client.from('admins').select('*').ilike('username', username.trim()).maybeSingle();
    return data;
  },

  async getAdminById(id: number): Promise<any | null> {
    const client = getSupabase();
    if (!client) return null;
    const { data } = await client.from('admins').select('id, username, name, created_at, password_hash').eq('id', id).maybeSingle();
    return data;
  },

  async updateAdminPassword(id: number, newHash: string): Promise<boolean> {
    const client = getSupabase();
    if (!client) return false;
    const { error } = await client.from('admins').update({ password_hash: newHash }).eq('id', id);
    return !error;
  },

  async updateAdminUsername(id: number, newUsername: string): Promise<boolean> {
    const client = getSupabase();
    if (!client) return false;
    const { error } = await client.from('admins').update({ username: newUsername }).eq('id', id);
    return !error;
  },

  // 6. Enquiries & Dashboard
  async trackEnquiry(productId: number | null, productName: string, type: string, ipHash: string): Promise<boolean> {
    const client = getSupabase();
    if (!client) return false;
    const { error } = await client.from('enquiries').insert([{
      product_id: productId || null,
      product_name: productName || '',
      type,
      ip_hash: ipHash
    }]);
    return !error;
  },

  async getDashboardMetrics(): Promise<any> {
    const client = getSupabase();
    if (!client) return null;

    const [
      { count: totalProducts },
      { count: inStock },
      { count: lowStock },
      { count: soldOut },
      { count: categoriesCount },
      { count: combosCount },
      { count: whatsappClicks },
      { count: callClicks },
      { data: recentProducts },
      { data: recentEnquiries }
    ] = await Promise.all([
      client.from('products').select('*', { count: 'exact', head: true }),
      client.from('products').select('*', { count: 'exact', head: true }).eq('stock_status', 'IN_STOCK'),
      client.from('products').select('*', { count: 'exact', head: true }).eq('stock_status', 'LOW_STOCK'),
      client.from('products').select('*', { count: 'exact', head: true }).eq('stock_status', 'SOLD_OUT'),
      client.from('categories').select('*', { count: 'exact', head: true }),
      client.from('combos').select('*', { count: 'exact', head: true }),
      client.from('enquiries').select('*', { count: 'exact', head: true }).eq('type', 'WHATSAPP'),
      client.from('enquiries').select('*', { count: 'exact', head: true }).eq('type', 'CALL'),
      client.from('products').select('id, product_code, name, price, stock_status, condition, categories(name)').order('id', { ascending: false }).limit(6),
      client.from('enquiries').select('*, products(slug)').order('id', { ascending: false }).limit(8)
    ]);

    return {
      metrics: {
        totalProducts: totalProducts || 0,
        inStock: inStock || 0,
        lowStock: lowStock || 0,
        soldOut: soldOut || 0,
        categoriesCount: categoriesCount || 0,
        combosCount: combosCount || 0,
        whatsappClicks: whatsappClicks || 0,
        callClicks: callClicks || 0
      },
      recentProducts: (recentProducts || []).map((p: any) => ({
        id: p.id,
        product_code: p.product_code,
        name: p.name,
        price: p.price,
        stock_status: p.stock_status,
        condition: p.condition,
        category_name: p.categories?.name
      })),
      recentEnquiries: (recentEnquiries || []).map((e: any) => ({
        ...e,
        product_slug: e.products?.slug
      }))
    };
  },

  // 7. Database Status
  async getDbStatus(): Promise<any> {
    const client = getSupabase();
    if (!client) return null;

    const [
      { count: productCount },
      { count: categoryCount },
      { count: comboCount },
      { count: adminCount },
      { data: adminRecord }
    ] = await Promise.all([
      client.from('products').select('*', { count: 'exact', head: true }),
      client.from('categories').select('*', { count: 'exact', head: true }),
      client.from('combos').select('*', { count: 'exact', head: true }),
      client.from('admins').select('*', { count: 'exact', head: true }),
      client.from('admins').select('id, username, name').order('id', { ascending: true }).limit(1).maybeSingle()
    ]);

    return {
      status: 'connected',
      integrity: 'HEALTHY',
      engine: 'Supabase PostgreSQL (Cloud Database)',
      databaseFile: 'cloud:supabase',
      counts: {
        products: productCount || 0,
        categories: categoryCount || 0,
        combos: comboCount || 0,
        admins: adminCount || 0
      },
      currentAdmin: adminRecord ? { id: adminRecord.id, username: adminRecord.username, name: adminRecord.name } : null
    };
  },

  // 8. Storage Image Upload
  async uploadImage(filename: string, fileBuffer: Buffer, mimeType: string): Promise<string | null> {
    const client = getSupabase();
    if (!client) return null;

    try {
      const bucket = 'pc-parts-images';
      const cleanName = filename.replace(/[^a-zA-Z0-9._-]/g, '');
      const uniquePath = `parts/${Date.now()}-${cleanName}`;

      const { data, error } = await client.storage.from(bucket).upload(uniquePath, fileBuffer, {
        contentType: mimeType,
        upsert: true
      });

      if (error) {
        console.warn('Supabase storage upload returned error:', error.message);
        return null;
      }

      const { data: publicData } = client.storage.from(bucket).getPublicUrl(uniquePath);
      return publicData?.publicUrl || null;
    } catch (err) {
      console.warn('Failed to upload image to Supabase Storage:', err);
      return null;
    }
  }
};
