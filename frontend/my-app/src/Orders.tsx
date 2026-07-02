import './Orders.css';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Cookies from 'js-cookie';
import { BASE_URL } from './api';
import { HiOutlineArrowLeft, HiOutlineCube, HiOutlineShoppingBag, HiTrash } from 'react-icons/hi2';

type OrderProduct = {
    _id: string;
    name: string;
    category: string;
    price: number;
    image: string;
    description: string;
};

type OrderItem = {
    _id: string;
    quantity: number;
    product: OrderProduct | null;
};

function Orders() {
    const [orders, setOrders] = useState<OrderItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [orderingError, setOrderingError] = useState<string>('');
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
    const [cancelingOrderId, setCancelingOrderId] = useState<string>('');
    const navigate = useNavigate();
    const { id } = useParams();

    useEffect(() => {
        const controller = new AbortController();

        const fetchOrders = async (): Promise<void> => {
            try {
                setLoading(true);
                setOrderingError('');

                const loadOrders = async (): Promise<Response> => {
                    return fetch(`${BASE_URL}/client/orders`, {
                        method: 'GET',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' },
                        signal: controller.signal,
                    });
                };

                let response = await loadOrders();
                let data = await response.json();

                if (data.succ) {
                    setOrders(data.orders ?? []);
                    return;
                }

                if (data.error === 'unauthorized!') {
                    const refreshResponse = await fetch(`${BASE_URL}/refresh`, {
                        method: 'POST',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' },
                        signal: controller.signal,
                    });

                    const refreshData = await refreshResponse.json();
                    if (refreshData.succ) {
                        response = await loadOrders();
                        data = await response.json();

                        if (data.succ) {
                            setOrders(data.orders ?? []);
                            return;
                        }
                    } else {
                        setIsLoggedIn(false);
                        return;
                    }
                }

                setOrderingError(data.error || 'Unable to load orders.');
            } catch (error) {
                if (!controller.signal.aborted) {
                    console.error('Error loading orders:', error);
                    setOrderingError('Unable to load orders right now.');
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        fetchOrders();

        return () => {
            controller.abort();
        };
    }, []);

    const handleCancelOrder = async (orderId: string): Promise<void> => {
        if (cancelingOrderId) {
            return;
        }

        const submitCancel = async (csrfToken: string): Promise<Response> => {
            return fetch(`${BASE_URL}/client/deleteorder`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'x-csrf-token': csrfToken,
                },
                body: JSON.stringify({ orderId }),
            });
        };

        try {
            setCancelingOrderId(orderId);
            setOrderingError('');

            const csrfToken = Cookies.get('csrfToken') || '';
            let response = await submitCancel(csrfToken);
            let data = await response.json();

            if (data.succ) {
                setOrders((previousOrders) => previousOrders.filter((order) => order._id !== orderId));
                return;
            }

            if (data.error === 'unauthorized!' || data.error === 'invalid CSRF token!') {
                const refreshResponse = await fetch(`${BASE_URL}/refresh`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                });

                const refreshData = await refreshResponse.json();
                if (refreshData.succ) {
                    const refreshedCsrfToken = Cookies.get('csrfToken') || '';
                    response = await submitCancel(refreshedCsrfToken);
                    data = await response.json();

                    if (data.succ) {
                        setOrders((previousOrders) => previousOrders.filter((order) => order._id !== orderId));
                        return;
                    }
                } else {
                    setIsLoggedIn(false);
                    return;
                }
            }

            if (data.error) {
                setOrderingError(data.error);
            }
        } catch (error) {
            console.error('Error canceling order:', error);
            setOrderingError('Unable to cancel this order right now.');
        } finally {
            setCancelingOrderId('');
        }
    };

    if (!isLoggedIn) {
        return (
            <div className="orders-page orders-page--error">
                <h2>Access denied</h2>
                <p>You are not logged in. Please sign in again.</p>
            </div>
        );
    }

    return (
        <div className="orders-page">
            <header className="orders-header">
                <button className="orders-back-btn" type="button" onClick={() => navigate(`/dashboard/${id ?? ''}`)}>
                    <HiOutlineArrowLeft />
                    Back to dashboard
                </button>

                <div className="orders-title-wrap">
                    <div className="orders-badge">
                        <HiOutlineShoppingBag />
                    </div>
                    <div>
                        <h1>Your Orders</h1>
                        <p>All orders made by your account</p>
                    </div>
                </div>
            </header>

            <main className="orders-content">
                {loading && (
                    <div className="orders-state">
                        <div className="spinner"></div>
                        <p>Loading your orders...</p>
                    </div>
                )}

                {!loading && orderingError && (
                    <div className="orders-state orders-state--error">
                        <HiOutlineCube />
                        <h3>Could not load orders</h3>
                        <p>{orderingError}</p>
                    </div>
                )}

                {!loading && !orderingError && orders.length === 0 && (
                    <div className="orders-state">
                        <HiOutlineShoppingBag />
                        <h3>No orders yet</h3>
                        <p>Once you place an order, it will appear here.</p>
                    </div>
                )}

                {!loading && !orderingError && orders.length > 0 && (
                    <section className="orders-grid">
                        {orders.map((order) => {
                            const product = order.product;
                            const total = product ? product.price * order.quantity : 0;

                            return (
                                <article className="order-card" key={order._id}>
                                    <div className="order-card-image-wrap">
                                        {product?.image ? (
                                            <img src={product.image} alt={product.name} className="order-card-image" />
                                        ) : (
                                            <div className="order-card-image-fallback">
                                                <HiOutlineCube />
                                            </div>
                                        )}
                                    </div>

                                    <div className="order-card-info">
                                        <div className="order-card-topline">
                                            <span className="order-card-category">{product?.category || 'Unknown category'}</span>
                                            <span className="order-card-quantity">Qty: {order.quantity}</span>
                                        </div>

                                        <h2 className="order-card-title">{product?.name || 'Deleted product'}</h2>
                                        <p className="order-card-description">
                                            {product?.description || 'The product details are no longer available.'}
                                        </p>

                                        <div className="order-card-meta">
                                            <div>
                                                <span className="order-card-label">Unit price</span>
                                                <strong>{product ? `${product.price.toFixed(2)} DA` : '--'}</strong>
                                            </div>
                                            <div>
                                                <span className="order-card-label">Total</span>
                                                <strong>{product ? `${total.toFixed(2)} DA` : '--'}</strong>
                                            </div>
                                        </div>

                                        <button
                                            className="cancel-order-btn"
                                            type="button"
                                            onClick={() => handleCancelOrder(order._id)}
                                            disabled={cancelingOrderId === order._id}
                                        >
                                            {cancelingOrderId === order._id ? (
                                                <span className="cancel-spinner" aria-label="Canceling order" />
                                            ) : (
                                                <>
                                                    <HiTrash />
                                                    Cancel order
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </article>
                            );
                        })}
                    </section>
                )}
            </main>
        </div>
    );
}

export default Orders;