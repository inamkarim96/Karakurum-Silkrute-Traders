import { useState, useEffect, useCallback, useRef } from 'react';
import * as productsApi from '../api/products';

/**
 * @param {Object} options
 * @param {boolean} options.isAdmin - Whether to fetch for admin dashboard
 * @param {Object} options.initialFilters - Initial filters for fetching
 */
export const useProducts = ({ isAdmin = false, initialFilters = {} } = {}) => {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);

  // Track whether the initial mount fetch has already fired
  // to prevent a second fetch when the filters effect runs on mount
  const isMountedFetch = useRef(false);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await productsApi.getCategories();
      if (res.success) {
        setCategories(res.data?.categories || []);
        setError(null);
      } else {
        setError('Failed to load categories');
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      setError(err?.response?.data?.error?.message || 'Failed to load categories');
    }
  }, []);

  const fetchProducts = useCallback(async (currentFilters) => {
    const resolvedFilters = currentFilters ?? filters;
    try {
      setLoading(true);
      setError(null);

      const apiCall = isAdmin ? productsApi.getAdminProducts : productsApi.getProducts;
      const res = await apiCall(resolvedFilters);

      if (res.success) {
        setProducts(res.data.products || []);
        if (res.data.pagination) setPagination(res.data.pagination);
        return res.data;
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mount effect: fetch categories and initial products in parallel — single fetch only
  useEffect(() => {
    isMountedFetch.current = true;
    Promise.all([
      fetchCategories(),
      fetchProducts(initialFilters)
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filters effect: skip on mount (isMountedFetch.current === true means mount just ran)
  // Only fires when filters change after the initial mount
  useEffect(() => {
    if (isMountedFetch.current) {
      isMountedFetch.current = false;
      return; // skip — mount effect already fetched with initialFilters
    }
    fetchProducts(filters);
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    products,
    pagination,
    categories,
    loading,
    error,
    filters,
    setFilters,
    refresh: fetchProducts,
    refreshCategories: fetchCategories,
    setProducts,
  };
};

export default useProducts;
