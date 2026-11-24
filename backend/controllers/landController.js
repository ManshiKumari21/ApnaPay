const crypto = require('crypto');
const db = require('../config/db');
const NotificationService = require('../services/notificationService');

// Helper: Format amount as Indian Rupee string
const formatCurrency = (amount, currency = 'INR') => {
    const num = parseFloat(amount) || 0;
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Helper: Ensure 2 decimal places float
const toDecimal = (num) => {
    return parseFloat(parseFloat(num || 0).toFixed(2));
};

// ==========================================
// 1. GET /api/land/projects - Get all available land projects
// ==========================================
exports.getProjects = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
        const offset = (page - 1) * limit;

        const statusFilter = req.query.status ? String(req.query.status).trim().toLowerCase() : 'active';
        const search = req.query.search ? String(req.query.search).trim() : null;

        const whereClauses = [];
        const queryParams = [];

        if (statusFilter !== 'all') {
            whereClauses.push('status = ?');
            queryParams.push(statusFilter);
        }

        if (search) {
            whereClauses.push('(project_name LIKE ? OR location LIKE ? OR description LIKE ?)');
            queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        // 1. Count Total Projects
        const countSql = `SELECT COUNT(*) AS total FROM land_projects ${whereSql}`;
        const [countResult] = await db.execute(countSql, queryParams);
        const totalRecords = countResult[0]?.total || 0;
        const totalPages = Math.ceil(totalRecords / limit);

        // 2. Fetch Paginated Projects
        const dataSql = `
            SELECT 
                id,
                project_name,
                description,
                location,
                total_area,
                total_units,
                available_units,
                unit_name,
                price_per_unit,
                status,
                created_at,
                updated_at
            FROM land_projects
            ${whereSql}
            ORDER BY id ASC
            LIMIT ${Number(limit)} OFFSET ${Number(offset)}
        `;

        const [rows] = await db.execute(dataSql, queryParams);

        const projects = rows.map((p) => {
            const price = toDecimal(p.price_per_unit);
            return {
                id: p.id,
                projectName: p.project_name,
                description: p.description,
                location: p.location,
                totalArea: toDecimal(p.total_area),
                totalUnits: toDecimal(p.total_units),
                availableUnits: toDecimal(p.available_units),
                unitName: p.unit_name,
                pricePerUnit: price,
                formattedPricePerUnit: `${formatCurrency(price)} / ${p.unit_name}`,
                status: p.status,
                createdAt: p.created_at,
                updatedAt: p.updated_at
            };
        });

        return res.status(200).json({
            success: true,
            message: 'Land projects retrieved successfully.',
            data: {
                pagination: {
                    totalRecords,
                    page,
                    limit,
                    totalPages,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                },
                filters: {
                    status: statusFilter,
                    search: search || null
                },
                projects
            }
        });

    } catch (error) {
        console.error('Get Land Projects Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve land projects. Please try again.'
        });
    }
};

// ==========================================
// 2. GET /api/land/projects/:id - Get specific project details
// ==========================================
exports.getProjectById = async (req, res) => {
    try {
        const rawId = req.params.id;
        if (!rawId || !/^\d+$/.test(rawId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid project ID format.'
            });
        }

        const projectId = parseInt(rawId, 10);

        const [rows] = await db.execute(
            `SELECT 
                id,
                project_name,
                description,
                location,
                total_area,
                total_units,
                available_units,
                unit_name,
                price_per_unit,
                status,
                created_at,
                updated_at
             FROM land_projects
             WHERE id = ?`,
            [projectId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Project not found.'
            });
        }

        const project = rows[0];
        const price = toDecimal(project.price_per_unit);

        // Fetch latest valuation information for this project
        const [valRows] = await db.execute(
            `SELECT 
                previous_valuation,
                current_valuation,
                price_per_unit,
                valuation_source,
                valued_at
             FROM land_valuations
             WHERE project_id = ?
             ORDER BY valued_at DESC, id DESC
             LIMIT 1`,
            [projectId]
        );

        let latestValuation = null;
        if (valRows.length > 0) {
            const val = valRows[0];
            const prevVal = toDecimal(val.previous_valuation);
            const currVal = toDecimal(val.current_valuation);
            const growthRate = prevVal > 0 ? toDecimal(((currVal - prevVal) / prevVal) * 100) : 0;

            latestValuation = {
                previousValuation: prevVal,
                formattedPreviousValuation: formatCurrency(prevVal),
                currentValuation: currVal,
                formattedCurrentValuation: formatCurrency(currVal),
                pricePerUnit: toDecimal(val.price_per_unit),
                growthPercentage: growthRate,
                valuationSource: val.valuation_source || 'Official Valuation Authority',
                valuedAt: val.valued_at
            };
        }

        return res.status(200).json({
            success: true,
            message: 'Project details retrieved successfully.',
            data: {
                id: project.id,
                projectName: project.project_name,
                description: project.description,
                location: project.location,
                totalArea: toDecimal(project.total_area),
                totalUnits: toDecimal(project.total_units),
                availableUnits: toDecimal(project.available_units),
                unitName: project.unit_name,
                pricePerUnit: price,
                formattedPricePerUnit: `${formatCurrency(price)} / ${project.unit_name}`,
                status: project.status,
                latestValuation,
                createdAt: project.created_at,
                updatedAt: project.updated_at
            }
        });

    } catch (error) {
        console.error('Get Project Details Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve project details. Please try again.'
        });
    }
};

// ==========================================
// 3. GET /api/land/holdings - Get logged-in user's land holdings
// ==========================================
exports.getHoldings = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized access.'
            });
        }

        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
        const offset = (page - 1) * limit;

        // 1. Total Count Query
        const countSql = `
            SELECT COUNT(*) AS total 
            FROM land_holdings h 
            WHERE h.user_id = ? AND h.units_owned > 0
        `;
        const [countResult] = await db.execute(countSql, [userId]);
        const totalRecords = countResult[0]?.total || 0;
        const totalPages = Math.ceil(totalRecords / limit);

        // 2. Fetch User Holdings joined with Project Info
        const dataSql = `
            SELECT 
                h.id AS holding_id,
                h.user_id,
                h.project_id,
                h.units_owned,
                h.average_purchase_price,
                h.total_invested,
                h.status AS holding_status,
                h.created_at AS purchase_date,
                h.updated_at,
                p.project_name,
                p.location,
                p.unit_name,
                p.price_per_unit AS current_price_per_unit,
                p.status AS project_status
            FROM land_holdings h
            JOIN land_projects p ON h.project_id = p.id
            WHERE h.user_id = ? AND h.units_owned > 0
            ORDER BY h.updated_at DESC, h.id DESC
            LIMIT ${Number(limit)} OFFSET ${Number(offset)}
        `;

        const [rows] = await db.execute(dataSql, [userId]);

        let totalPortfolioInvested = 0;
        let totalPortfolioCurrentValue = 0;

        const holdings = rows.map((h) => {
            const units = toDecimal(h.units_owned);
            const avgPrice = toDecimal(h.average_purchase_price);
            const invested = toDecimal(h.total_invested > 0 ? h.total_invested : units * avgPrice);
            const currentPrice = toDecimal(h.current_price_per_unit);
            const currentValue = toDecimal(units * currentPrice);
            const gainLoss = toDecimal(currentValue - invested);
            const gainLossPercentage = invested > 0 ? toDecimal((gainLoss / invested) * 100) : 0;

            totalPortfolioInvested += invested;
            totalPortfolioCurrentValue += currentValue;

            return {
                id: h.holding_id,
                projectId: h.project_id,
                projectName: h.project_name,
                location: h.location,
                unitsOwned: units,
                unitName: h.unit_name,
                averagePurchasePrice: avgPrice,
                formattedAveragePrice: formatCurrency(avgPrice),
                totalInvested: invested,
                formattedTotalInvested: formatCurrency(invested),
                currentPricePerUnit: currentPrice,
                formattedCurrentPrice: formatCurrency(currentPrice),
                currentValue,
                formattedCurrentValue: formatCurrency(currentValue),
                unrealizedGainLoss: gainLoss,
                formattedGainLoss: `${gainLoss >= 0 ? '+' : ''}${formatCurrency(gainLoss)}`,
                gainLossPercentage,
                status: h.holding_status,
                purchaseDate: h.purchase_date,
                lastUpdated: h.updated_at
            };
        });

        const totalPortfolioGainLoss = toDecimal(totalPortfolioCurrentValue - totalPortfolioInvested);

        return res.status(200).json({
            success: true,
            message: 'User land holdings retrieved successfully.',
            data: {
                portfolioSummary: {
                    totalHoldings: totalRecords,
                    totalInvested: toDecimal(totalPortfolioInvested),
                    formattedTotalInvested: formatCurrency(totalPortfolioInvested),
                    currentValue: toDecimal(totalPortfolioCurrentValue),
                    formattedCurrentValue: formatCurrency(totalPortfolioCurrentValue),
                    unrealizedGainLoss: totalPortfolioGainLoss,
                    formattedGainLoss: `${totalPortfolioGainLoss >= 0 ? '+' : ''}${formatCurrency(totalPortfolioGainLoss)}`
                },
                pagination: {
                    totalRecords,
                    page,
                    limit,
                    totalPages,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                },
                holdings
            }
        });

    } catch (error) {
        console.error('Get Land Holdings Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve land holdings. Please try again.'
        });
    }
};

// ==========================================
// 4. POST /api/land/orders - Create a land purchase/order request
// ==========================================
exports.createOrder = async (req, res) => {
    const conn = await db.getConnection();
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized access.'
            });
        }

        const { projectId, units, quantity, area, notes } = req.body || {};

        // 1. Validate Input
        const rawProjectId = projectId || req.body?.project_id;
        if (!rawProjectId || !/^\d+$/.test(String(rawProjectId))) {
            return res.status(400).json({
                success: false,
                message: 'Valid project ID is required.'
            });
        }

        const reqUnits = parseFloat(units || quantity || area);
        if (!reqUnits || isNaN(reqUnits) || reqUnits <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Units/area must be a positive number greater than zero.'
            });
        }

        await conn.beginTransaction();

        // 2. Fetch Project & Verify Availability (with row lock)
        const [projects] = await conn.query(
            `SELECT id, project_name, unit_name, price_per_unit, available_units, status
             FROM land_projects
             WHERE id = ?
             FOR UPDATE`,
            [Number(rawProjectId)]
        );

        if (projects.length === 0) {
            await conn.rollback();
            return res.status(404).json({
                success: false,
                message: 'Project not found.'
            });
        }

        const project = projects[0];

        if (project.status !== 'active') {
            await conn.rollback();
            return res.status(400).json({
                success: false,
                message: `Project is not currently available for orders (Status: ${project.status}).`
            });
        }

        const available = parseFloat(project.available_units) || 0;
        if (reqUnits > available) {
            await conn.rollback();
            return res.status(400).json({
                success: false,
                message: `Requested units (${reqUnits} ${project.unit_name}) exceed available units (${available} ${project.unit_name}).`
            });
        }

        // 3. Prevent duplicate order spam within 30 seconds
        const [recentOrders] = await conn.query(
            `SELECT id FROM land_orders 
             WHERE user_id = ? AND project_id = ? AND units = ? AND created_at >= NOW() - INTERVAL 30 SECOND
             LIMIT 1`,
            [userId, project.id, reqUnits]
        );

        if (recentOrders.length > 0) {
            await conn.rollback();
            return res.status(409).json({
                success: false,
                message: 'A duplicate order request for this project and unit size was recently submitted. Please wait before retrying.'
            });
        }

        // 4. Calculate total amount accurately on backend
        const pricePerUnit = toDecimal(project.price_per_unit);
        const totalAmount = toDecimal(reqUnits * pricePerUnit);

        // 5. Generate Unique Order Reference
        const dateCode = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randomCode = crypto.randomBytes(3).toString('hex').toUpperCase();
        const orderReference = `LND-${dateCode}-${randomCode}`;

        // 6. Insert into land_orders table
        const [orderResult] = await conn.query(
            `INSERT INTO land_orders (order_reference, user_id, project_id, units, price_per_unit, total_amount, status)
             VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
            [orderReference, userId, project.id, reqUnits, pricePerUnit, totalAmount]
        );

        const newOrderId = orderResult.insertId;

        // 7. Record transaction in land_transactions
        await conn.query(
            `INSERT INTO land_transactions (user_id, order_id, project_id, order_reference, transaction_type, units, amount, status, description)
             VALUES (?, ?, ?, ?, 'order_request', ?, ?, 'pending', ?)`,
            [
                userId,
                newOrderId,
                project.id,
                orderReference,
                reqUnits,
                totalAmount,
                notes ? String(notes).slice(0, 255) : `Land purchase request for ${project.project_name}`
            ]
        );

        await conn.commit();

        // Non-blocking notification dispatch
        NotificationService.notify({
            userId,
            title: 'Digital Land Order Submitted',
            message: `Your land order ${orderReference} for ${reqUnits} ${project.unit_name} of ${project.project_name} has been submitted and is awaiting admin approval.`,
            category: 'digital_land',
            type: 'info',
            referenceId: newOrderId,
            referenceType: 'land_order_created'
        }).catch(() => {});

        return res.status(201).json({
            success: true,
            message: 'Your land order has been submitted and is awaiting admin approval.',
            data: {
                orderId: newOrderId,
                orderReference,
                projectId: project.id,
                projectName: project.project_name,
                units: reqUnits,
                unitName: project.unit_name,
                pricePerUnit,
                formattedPricePerUnit: `${formatCurrency(pricePerUnit)} / ${project.unit_name}`,
                totalAmount,
                formattedTotalAmount: formatCurrency(totalAmount),
                status: 'pending',
                notes: notes || null,
                disclaimer: 'Your land order has been submitted and is awaiting admin approval before ownership is confirmed.',
                createdAt: new Date()
            }
        });

    } catch (error) {
        await conn.rollback();
        console.error('Create Land Order Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create land order. Please try again.'
        });
    } finally {
        conn.release();
    }
};

// ==========================================
// 5. GET /api/land/orders/:id - Get specific order status
// ==========================================
exports.getOrderById = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized access.'
            });
        }

        const rawParam = req.params.id;
        if (!rawParam) {
            return res.status(400).json({
                success: false,
                message: 'Order ID or order reference is required.'
            });
        }

        const isNumericId = /^\d+$/.test(rawParam);
        const queryParam = isNumericId ? [parseInt(rawParam, 10)] : [String(rawParam).trim()];
        const matchColumn = isNumericId ? 'o.id = ?' : 'o.order_reference = ?';

        const [rows] = await db.execute(
            `SELECT 
                o.id AS order_id,
                o.order_reference,
                o.user_id,
                o.project_id,
                o.units,
                o.price_per_unit,
                o.total_amount,
                o.status AS order_status,
                o.approved_by,
                o.approved_at,
                o.rejected_by,
                o.rejected_at,
                o.rejection_reason,
                o.created_at,
                o.updated_at,
                p.project_name,
                p.location,
                p.unit_name
            FROM land_orders o
            JOIN land_projects p ON o.project_id = p.id
            WHERE ${matchColumn}`,
            queryParam
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Order not found.'
            });
        }

        const order = rows[0];

        // Ensure user ownership: one user cannot view another user's order
        if (Number(order.user_id) !== Number(userId)) {
            return res.status(404).json({
                success: false,
                message: 'Order not found.'
            });
        }

        const units = toDecimal(order.units);
        const pricePerUnit = toDecimal(order.price_per_unit);
        const totalAmount = toDecimal(order.total_amount);

        return res.status(200).json({
            success: true,
            message: 'Order details retrieved successfully.',
            data: {
                id: order.order_id,
                orderReference: order.order_reference || `LND-ORD-${order.order_id}`,
                userId: order.user_id,
                projectId: order.project_id,
                projectName: order.project_name,
                location: order.location,
                units,
                unitName: order.unit_name,
                pricePerUnit,
                formattedPricePerUnit: `${formatCurrency(pricePerUnit)} / ${order.unit_name}`,
                totalAmount,
                formattedTotalAmount: formatCurrency(totalAmount),
                status: order.order_status,
                approvedBy: order.approved_by || null,
                approvedAt: order.approved_at || null,
                rejectedBy: order.rejected_by || null,
                rejectedAt: order.rejected_at || null,
                rejectionReason: order.rejection_reason || null,
                createdAt: order.created_at,
                updatedAt: order.updated_at
            }
        });

    } catch (error) {
        console.error('Get Land Order Details Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve order details. Please try again.'
        });
    }
};

// ==========================================
// 6. GET /api/land/transactions - Get land transaction history
// ==========================================
exports.getTransactions = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized access.'
            });
        }

        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
        const offset = (page - 1) * limit;

        const typeFilter = req.query.type ? String(req.query.type).trim().toLowerCase() : 'all';
        const statusFilter = req.query.status ? String(req.query.status).trim().toLowerCase() : 'all';
        const projectIdFilter = req.query.projectId ? parseInt(req.query.projectId, 10) : null;

        const whereClauses = ['t.user_id = ?'];
        const queryParams = [userId];

        if (typeFilter !== 'all') {
            whereClauses.push('t.transaction_type = ?');
            queryParams.push(typeFilter);
        }

        if (statusFilter !== 'all') {
            whereClauses.push('t.status = ?');
            queryParams.push(statusFilter);
        }

        if (projectIdFilter && !isNaN(projectIdFilter)) {
            whereClauses.push('t.project_id = ?');
            queryParams.push(projectIdFilter);
        }

        const whereSql = `WHERE ${whereClauses.join(' AND ')}`;

        // 1. Count Total Records
        const countSql = `SELECT COUNT(*) AS total FROM land_transactions t ${whereSql}`;
        const [countResult] = await db.execute(countSql, queryParams);
        const totalRecords = countResult[0]?.total || 0;
        const totalPages = Math.ceil(totalRecords / limit);

        // 2. Fetch Paginated Transactions
        const dataSql = `
            SELECT 
                t.id,
                t.order_id,
                t.order_reference,
                t.project_id,
                t.transaction_type,
                t.units,
                t.amount,
                t.status,
                t.description,
                t.created_at,
                p.project_name,
                p.location,
                p.unit_name
            FROM land_transactions t
            JOIN land_projects p ON t.project_id = p.id
            ${whereSql}
            ORDER BY t.created_at DESC, t.id DESC
            LIMIT ${Number(limit)} OFFSET ${Number(offset)}
        `;

        const [rows] = await db.execute(dataSql, queryParams);

        const transactions = rows.map((r) => {
            const amountVal = toDecimal(r.amount);
            const unitsVal = toDecimal(r.units);
            return {
                id: r.id,
                orderId: r.order_id,
                orderReference: r.order_reference || (r.order_id ? `LND-ORD-${r.order_id}` : `LND-TXN-${r.id}`),
                projectId: r.project_id,
                projectName: r.project_name,
                location: r.location,
                transactionType: r.transaction_type,
                units: unitsVal,
                unitName: r.unit_name,
                amount: amountVal,
                formattedAmount: formatCurrency(amountVal),
                status: r.status,
                description: r.description,
                createdAt: r.created_at
            };
        });

        return res.status(200).json({
            success: true,
            message: 'Land transactions retrieved successfully.',
            data: {
                pagination: {
                    totalRecords,
                    page,
                    limit,
                    totalPages,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                },
                filters: {
                    type: typeFilter,
                    status: statusFilter,
                    projectId: projectIdFilter || null
                },
                transactions
            }
        });

    } catch (error) {
        console.error('Get Land Transactions Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve land transactions. Please try again.'
        });
    }
};

// ==========================================
// 7. GET /api/land/valuations - Get land valuation history
// ==========================================
exports.getValuations = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
        const offset = (page - 1) * limit;

        const projectIdFilter = req.query.projectId || req.query.project_id;
        const whereClauses = [];
        const queryParams = [];

        if (projectIdFilter && /^\d+$/.test(String(projectIdFilter))) {
            whereClauses.push('v.project_id = ?');
            queryParams.push(parseInt(projectIdFilter, 10));
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        // 1. Count Total Valuations
        const countSql = `SELECT COUNT(*) AS total FROM land_valuations v ${whereSql}`;
        const [countResult] = await db.execute(countSql, queryParams);
        const totalRecords = countResult[0]?.total || 0;
        const totalPages = Math.ceil(totalRecords / limit);

        // 2. Fetch Valuations joined with Project
        const dataSql = `
            SELECT 
                v.id,
                v.project_id,
                v.previous_valuation,
                v.current_valuation,
                v.price_per_unit,
                v.valuation_source,
                v.valued_at,
                v.created_at,
                p.project_name,
                p.location,
                p.unit_name
            FROM land_valuations v
            JOIN land_projects p ON v.project_id = p.id
            ${whereSql}
            ORDER BY v.valued_at DESC, v.id DESC
            LIMIT ${Number(limit)} OFFSET ${Number(offset)}
        `;

        const [rows] = await db.execute(dataSql, queryParams);

        const valuations = rows.map((v) => {
            const prev = toDecimal(v.previous_valuation);
            const curr = toDecimal(v.current_valuation);
            const price = toDecimal(v.price_per_unit);
            const growthPercentage = prev > 0 ? toDecimal(((curr - prev) / prev) * 100) : 0;

            return {
                id: v.id,
                projectId: v.project_id,
                projectName: v.project_name,
                location: v.location,
                unitName: v.unit_name,
                previousValuation: prev,
                formattedPreviousValuation: formatCurrency(prev),
                currentValuation: curr,
                formattedCurrentValuation: formatCurrency(curr),
                pricePerUnit: price,
                formattedPricePerUnit: `${formatCurrency(price)} / ${v.unit_name}`,
                growthPercentage,
                valuationSource: v.valuation_source || 'Official Valuation Authority',
                valuedAt: v.valued_at,
                createdAt: v.created_at
            };
        });

        return res.status(200).json({
            success: true,
            message: 'Land valuations retrieved successfully.',
            data: {
                pagination: {
                    totalRecords,
                    page,
                    limit,
                    totalPages,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                },
                filters: {
                    projectId: projectIdFilter ? parseInt(projectIdFilter, 10) : null
                },
                valuations
            }
        });

    } catch (error) {
        console.error('Get Land Valuations Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve land valuations. Please try again.'
        });
    }
};

// ==========================================
// 8. GET /api/land/orders - Get logged-in user's land orders
// ==========================================
exports.getUserOrders = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized access.'
            });
        }

        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
        const offset = (page - 1) * limit;

        const statusFilter = req.query.status ? String(req.query.status).trim().toLowerCase() : 'all';

        const whereClauses = ['o.user_id = ?'];
        const queryParams = [userId];

        if (statusFilter !== 'all') {
            whereClauses.push('LOWER(o.status) = ?');
            queryParams.push(statusFilter);
        }

        const whereSql = `WHERE ${whereClauses.join(' AND ')}`;

        // 1. Total Count
        const countSql = `SELECT COUNT(*) AS total FROM land_orders o ${whereSql}`;
        const [countResult] = await db.execute(countSql, queryParams);
        const totalRecords = countResult[0]?.total || 0;
        const totalPages = Math.ceil(totalRecords / limit);

        // 2. Fetch User Orders joined with Project Details
        const dataSql = `
            SELECT 
                o.id,
                o.order_reference,
                o.user_id,
                o.project_id,
                o.units,
                o.price_per_unit,
                o.total_amount,
                o.status,
                o.approved_by,
                o.approved_at,
                o.rejected_by,
                o.rejected_at,
                o.rejection_reason,
                o.created_at,
                o.updated_at,
                p.project_name,
                p.location,
                p.unit_name
            FROM land_orders o
            JOIN land_projects p ON o.project_id = p.id
            ${whereSql}
            ORDER BY o.created_at DESC, o.id DESC
            LIMIT ${Number(limit)} OFFSET ${Number(offset)}
        `;

        const [rows] = await db.execute(dataSql, queryParams);

        const orders = rows.map((o) => {
            const units = toDecimal(o.units);
            const price = toDecimal(o.price_per_unit);
            const total = toDecimal(o.total_amount);

            return {
                id: o.id,
                orderReference: o.order_reference || `LND-ORD-${o.id}`,
                projectId: o.project_id,
                projectName: o.project_name,
                location: o.location,
                units,
                unitName: o.unit_name,
                pricePerUnit: price,
                formattedPricePerUnit: `${formatCurrency(price)} / ${o.unit_name}`,
                totalAmount: total,
                formattedTotalAmount: formatCurrency(total),
                status: String(o.status || 'pending').toLowerCase(),
                rejectionReason: o.rejection_reason || null,
                approvedAt: o.approved_at || null,
                rejectedAt: o.rejected_at || null,
                createdAt: o.created_at,
                updatedAt: o.updated_at
            };
        });

        return res.status(200).json({
            success: true,
            message: 'User land orders retrieved successfully.',
            data: {
                pagination: {
                    totalRecords,
                    page,
                    limit,
                    totalPages,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                },
                orders
            }
        });

    } catch (error) {
        console.error('Get User Land Orders Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve land orders. Please try again.'
        });
    }
};

// ==========================================
// 9. GET /api/land/admin/orders - Admin Land Orders & Dashboard Counts
// ==========================================
exports.getAdminOrders = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
        const offset = (page - 1) * limit;

        const statusFilter = req.query.status ? String(req.query.status).trim().toLowerCase() : 'all';
        const search = req.query.search ? String(req.query.search).trim() : null;

        // 1. Calculate Real Dynamic Dashboard Counts
        const [countStats] = await db.execute(`
            SELECT 
                COUNT(*) AS total_orders,
                SUM(CASE WHEN LOWER(status) = 'pending' THEN 1 ELSE 0 END) AS pending_orders,
                SUM(CASE WHEN LOWER(status) = 'approved' THEN 1 ELSE 0 END) AS approved_orders,
                SUM(CASE WHEN LOWER(status) = 'rejected' THEN 1 ELSE 0 END) AS rejected_orders
            FROM land_orders
        `);

        const dashboardCounts = {
            totalOrders: Number(countStats[0]?.total_orders || 0),
            pendingOrders: Number(countStats[0]?.pending_orders || 0),
            approvedOrders: Number(countStats[0]?.approved_orders || 0),
            rejectedOrders: Number(countStats[0]?.rejected_orders || 0)
        };

        // 2. Build Where Filter Clauses for Listing
        const whereClauses = [];
        const queryParams = [];

        if (statusFilter !== 'all') {
            whereClauses.push('LOWER(o.status) = ?');
            queryParams.push(statusFilter);
        }

        if (search) {
            whereClauses.push('(o.order_reference LIKE ? OR u.full_name LIKE ? OR u.email LIKE ? OR p.project_name LIKE ?)');
            queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        // 3. Count Filtered Records
        const countFilteredSql = `
            SELECT COUNT(*) AS total 
            FROM land_orders o
            JOIN users u ON o.user_id = u.id
            JOIN land_projects p ON o.project_id = p.id
            ${whereSql}
        `;
        const [filteredResult] = await db.execute(countFilteredSql, queryParams);
        const totalRecords = filteredResult[0]?.total || 0;
        const totalPages = Math.ceil(totalRecords / limit);

        // 4. Fetch Paginated Admin Orders joined with User and Project data
        const dataSql = `
            SELECT 
                o.id,
                o.order_reference,
                o.user_id,
                o.project_id,
                o.units,
                o.price_per_unit,
                o.total_amount,
                o.status,
                o.approved_by,
                o.approved_at,
                o.rejected_by,
                o.rejected_at,
                o.rejection_reason,
                o.created_at,
                o.updated_at,
                u.full_name AS user_name,
                u.email AS user_email,
                u.phone AS user_phone,
                p.project_name,
                p.location,
                p.unit_name,
                p.available_units AS project_available_units,
                p.price_per_unit AS current_project_price,
                a_app.full_name AS approved_by_name,
                a_rej.full_name AS rejected_by_name
            FROM land_orders o
            JOIN users u ON o.user_id = u.id
            JOIN land_projects p ON o.project_id = p.id
            LEFT JOIN admins a_app ON o.approved_by = a_app.id
            LEFT JOIN admins a_rej ON o.rejected_by = a_rej.id
            ${whereSql}
            ORDER BY o.created_at DESC, o.id DESC
            LIMIT ${Number(limit)} OFFSET ${Number(offset)}
        `;

        const [rows] = await db.execute(dataSql, queryParams);

        const orders = rows.map((o) => {
            const units = toDecimal(o.units);
            const price = toDecimal(o.price_per_unit);
            const total = toDecimal(o.total_amount);

            return {
                id: o.id,
                orderReference: o.order_reference || `LND-ORD-${o.id}`,
                userId: o.user_id,
                userName: o.user_name || 'Customer',
                userEmail: o.user_email || '',
                userPhone: o.user_phone || '',
                projectId: o.project_id,
                projectName: o.project_name,
                location: o.location,
                units,
                unitName: o.unit_name,
                projectAvailableUnits: toDecimal(o.project_available_units),
                pricePerUnit: price,
                formattedPricePerUnit: `${formatCurrency(price)} / ${o.unit_name}`,
                totalAmount: total,
                formattedTotalAmount: formatCurrency(total),
                status: String(o.status || 'pending').toLowerCase(),
                approvedBy: o.approved_by || null,
                approvedByName: o.approved_by_name || null,
                approvedAt: o.approved_at || null,
                rejectedBy: o.rejected_by || null,
                rejectedByName: o.rejected_by_name || null,
                rejectedAt: o.rejected_at || null,
                rejectionReason: o.rejection_reason || null,
                createdAt: o.created_at,
                updatedAt: o.updated_at
            };
        });

        return res.status(200).json({
            success: true,
            message: 'Admin land orders retrieved successfully.',
            data: {
                dashboardCounts,
                pagination: {
                    totalRecords,
                    page,
                    limit,
                    totalPages,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                },
                orders
            }
        });

    } catch (error) {
        console.error('Admin Get Land Orders Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve admin land orders. Please try again.'
        });
    }
};

// ==========================================
// 10. GET /api/land/admin/orders/:id - Admin Single Order Details
// ==========================================
exports.getAdminOrderById = async (req, res) => {
    try {
        const rawParam = req.params.id;
        if (!rawParam) {
            return res.status(400).json({
                success: false,
                message: 'Order ID is required.'
            });
        }

        const isNumericId = /^\d+$/.test(rawParam);
        const queryParam = isNumericId ? [parseInt(rawParam, 10)] : [String(rawParam).trim()];
        const matchColumn = isNumericId ? 'o.id = ?' : 'o.order_reference = ?';

        const [rows] = await db.execute(
            `SELECT 
                o.id,
                o.order_reference,
                o.user_id,
                o.project_id,
                o.units,
                o.price_per_unit,
                o.total_amount,
                o.status,
                o.approved_by,
                o.approved_at,
                o.rejected_by,
                o.rejected_at,
                o.rejection_reason,
                o.created_at,
                o.updated_at,
                u.full_name AS user_name,
                u.email AS user_email,
                u.phone AS user_phone,
                p.project_name,
                p.location,
                p.description AS project_description,
                p.unit_name,
                p.available_units AS project_available_units,
                p.price_per_unit AS current_project_price,
                a_app.full_name AS approved_by_name,
                a_rej.full_name AS rejected_by_name
            FROM land_orders o
            JOIN users u ON o.user_id = u.id
            JOIN land_projects p ON o.project_id = p.id
            LEFT JOIN admins a_app ON o.approved_by = a_app.id
            LEFT JOIN admins a_rej ON o.rejected_by = a_rej.id
            WHERE ${matchColumn}`,
            queryParam
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Land order not found.'
            });
        }

        const o = rows[0];
        const units = toDecimal(o.units);
        const price = toDecimal(o.price_per_unit);
        const total = toDecimal(o.total_amount);

        return res.status(200).json({
            success: true,
            message: 'Land order details retrieved successfully.',
            data: {
                id: o.id,
                orderReference: o.order_reference || `LND-ORD-${o.id}`,
                userId: o.user_id,
                userName: o.user_name || 'Customer',
                userEmail: o.user_email || '',
                userPhone: o.user_phone || '',
                projectId: o.project_id,
                projectName: o.project_name,
                location: o.location,
                projectDescription: o.project_description || '',
                units,
                unitName: o.unit_name,
                projectAvailableUnits: toDecimal(o.project_available_units),
                pricePerUnit: price,
                formattedPricePerUnit: `${formatCurrency(price)} / ${o.unit_name}`,
                totalAmount: total,
                formattedTotalAmount: formatCurrency(total),
                status: String(o.status || 'pending').toLowerCase(),
                approvedBy: o.approved_by || null,
                approvedByName: o.approved_by_name || null,
                approvedAt: o.approved_at || null,
                rejectedBy: o.rejected_by || null,
                rejectedByName: o.rejected_by_name || null,
                rejectedAt: o.rejected_at || null,
                rejectionReason: o.rejection_reason || null,
                createdAt: o.created_at,
                updatedAt: o.updated_at
            }
        });

    } catch (error) {
        console.error('Admin Get Land Order Details Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve order details. Please try again.'
        });
    }
};

// ==========================================
// 11. POST /api/land/admin/orders/:id/approve - Approve Land Order
// ==========================================
exports.approveOrder = async (req, res) => {
    const conn = await db.getConnection();
    try {
        const adminId = req.admin?.adminId;
        if (!adminId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized admin access.'
            });
        }

        const rawOrderId = req.params.id;
        if (!rawOrderId || !/^\d+$/.test(String(rawOrderId))) {
            return res.status(400).json({
                success: false,
                message: 'Valid order ID is required.'
            });
        }
        const orderId = parseInt(rawOrderId, 10);

        await conn.beginTransaction();

        // 1. Fetch Order with row-level lock
        const [orders] = await conn.query(
            `SELECT 
                o.id,
                o.order_reference,
                o.user_id,
                o.project_id,
                o.units,
                o.price_per_unit,
                o.total_amount,
                o.status,
                p.project_name,
                p.unit_name,
                p.available_units,
                u.full_name AS user_name
             FROM land_orders o
             JOIN land_projects p ON o.project_id = p.id
             JOIN users u ON o.user_id = u.id
             WHERE o.id = ?
             FOR UPDATE`,
            [orderId]
        );

        if (orders.length === 0) {
            await conn.rollback();
            return res.status(404).json({
                success: false,
                message: 'Land order not found.'
            });
        }

        const order = orders[0];
        const currentStatus = String(order.status || '').toLowerCase();

        // 2. Strict State Check: Only 'pending' orders can be approved
        if (currentStatus !== 'pending') {
            await conn.rollback();
            return res.status(400).json({
                success: false,
                message: `Order #${order.id} cannot be approved because it is already '${currentStatus.toUpperCase()}'. Only pending orders can be approved.`
            });
        }

        const reqUnits = parseFloat(order.units);
        const availUnits = parseFloat(order.available_units);

        // 3. Inventory Availability Verification
        if (reqUnits > availUnits) {
            await conn.rollback();
            return res.status(400).json({
                success: false,
                message: `Insufficient inventory in project '${order.project_name}'. Available: ${availUnits} ${order.unit_name}, Requested: ${reqUnits} ${order.unit_name}.`
            });
        }

        // 4. Deduct Inventory from land_projects
        await conn.query(
            `UPDATE land_projects 
             SET available_units = GREATEST(0, available_units - ?) 
             WHERE id = ?`,
            [reqUnits, order.project_id]
        );

        // 5. Update Order status to 'approved'
        await conn.query(
            `UPDATE land_orders 
             SET status = 'approved', approved_by = ?, approved_at = NOW() 
             WHERE id = ?`,
            [adminId, order.id]
        );

        // 6. Create or Update User Holdings (Only after successful approval)
        const [existingHoldings] = await conn.query(
            `SELECT id, units_owned, average_purchase_price, total_invested 
             FROM land_holdings 
             WHERE user_id = ? AND project_id = ? 
             FOR UPDATE`,
            [order.user_id, order.project_id]
        );

        const orderTotal = parseFloat(order.total_amount);

        if (existingHoldings.length > 0) {
            const holding = existingHoldings[0];
            const oldUnits = parseFloat(holding.units_owned) || 0;
            const oldInvested = parseFloat(holding.total_invested) || 0;

            const newUnits = toDecimal(oldUnits + reqUnits);
            const newInvested = toDecimal(oldInvested + orderTotal);
            const newAvgPrice = newUnits > 0 ? toDecimal(newInvested / newUnits) : toDecimal(order.price_per_unit);

            await conn.query(
                `UPDATE land_holdings 
                 SET units_owned = ?, average_purchase_price = ?, total_invested = ?, status = 'active', updated_at = NOW() 
                 WHERE id = ?`,
                [newUnits, newAvgPrice, newInvested, holding.id]
            );
        } else {
            await conn.query(
                `INSERT INTO land_holdings 
                 (user_id, project_id, units_owned, average_purchase_price, total_invested, status) 
                 VALUES (?, ?, ?, ?, ?, 'active')`,
                [order.user_id, order.project_id, reqUnits, toDecimal(order.price_per_unit), orderTotal]
            );
        }

        // 7. Update land_transactions audit record to completed
        await conn.query(
            `UPDATE land_transactions 
             SET status = 'completed', description = ? 
             WHERE order_id = ?`,
            [`Order ${order.order_reference} approved by Administrator #${adminId}`, order.id]
        );

        // 8. Create In-App Notification for user within transaction (Consistent & Atomic)
        const approvalDateStr = new Date().toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
        const approvalMessage = `Congratulations! Your land order for ${order.project_name} has been approved by the Admin. Your holdings have been updated successfully.\nOrder ID: #${order.id} (${order.order_reference}) | Date: ${approvalDateStr} | Status: APPROVED`;

        await NotificationService.notify({
            userId: order.user_id,
            title: 'Land Order Approved',
            message: approvalMessage,
            category: 'digital_land',
            type: 'success',
            referenceId: order.id,
            referenceType: 'LAND_ORDER_APPROVED',
            notificationType: 'LAND_ORDER_APPROVED',
            conn
        });

        await conn.commit();

        return res.status(200).json({
            success: true,
            message: `Land order #${order.id} (${order.order_reference}) approved successfully. User holdings updated and notification delivered.`,
            data: {
                orderId: order.id,
                orderReference: order.order_reference,
                userId: order.user_id,
                projectId: order.project_id,
                projectName: order.project_name,
                units: reqUnits,
                unitName: order.unit_name,
                totalAmount: orderTotal,
                status: 'approved',
                approvedBy: adminId,
                approvedAt: new Date()
            }
        });

    } catch (error) {
        await conn.rollback();
        console.error('Approve Land Order Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to approve land order. Please try again.'
        });
    } finally {
        conn.release();
    }
};

// ==========================================
// 12. POST /api/land/admin/orders/:id/reject - Reject Land Order
// ==========================================
exports.rejectOrder = async (req, res) => {
    const conn = await db.getConnection();
    try {
        const adminId = req.admin?.adminId;
        if (!adminId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized admin access.'
            });
        }

        const rawOrderId = req.params.id;
        if (!rawOrderId || !/^\d+$/.test(String(rawOrderId))) {
            return res.status(400).json({
                success: false,
                message: 'Valid order ID is required.'
            });
        }
        const orderId = parseInt(rawOrderId, 10);

        const reason = String(req.body?.reason || req.body?.rejectionReason || '').trim();
        if (!reason) {
            return res.status(400).json({
                success: false,
                message: 'Rejection reason is required and cannot be empty.'
            });
        }

        await conn.beginTransaction();

        // 1. Fetch Order with row-level lock
        const [orders] = await conn.query(
            `SELECT 
                o.id,
                o.order_reference,
                o.user_id,
                o.project_id,
                o.units,
                o.price_per_unit,
                o.total_amount,
                o.status,
                p.project_name,
                p.unit_name,
                u.full_name AS user_name
             FROM land_orders o
             JOIN land_projects p ON o.project_id = p.id
             JOIN users u ON o.user_id = u.id
             WHERE o.id = ?
             FOR UPDATE`,
            [orderId]
        );

        if (orders.length === 0) {
            await conn.rollback();
            return res.status(404).json({
                success: false,
                message: 'Land order not found.'
            });
        }

        const order = orders[0];
        const currentStatus = String(order.status || '').toLowerCase();

        // 2. Strict State Check: Only 'pending' orders can be rejected
        if (currentStatus !== 'pending') {
            await conn.rollback();
            return res.status(400).json({
                success: false,
                message: `Order #${order.id} cannot be rejected because it is already '${currentStatus.toUpperCase()}'. Only pending orders can be rejected.`
            });
        }

        // 3. Update Order status to 'rejected'
        await conn.query(
            `UPDATE land_orders 
             SET status = 'rejected', rejected_by = ?, rejected_at = NOW(), rejection_reason = ? 
             WHERE id = ?`,
            [adminId, reason.slice(0, 255), order.id]
        );

        // 4. Update land_transactions audit record to rejected
        await conn.query(
            `UPDATE land_transactions 
             SET status = 'failed', description = ? 
             WHERE order_id = ?`,
            [`Order ${order.order_reference} rejected by Admin #${adminId}. Reason: ${reason.slice(0, 150)}`, order.id]
        );

        // 5. Create In-App Notification for user within transaction (Consistent & Atomic)
        const rejectionDateStr = new Date().toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
        const rejectionMessage = `Your land order for ${order.project_name} has been rejected by the Admin.\nRejection Reason: ${reason}\nOrder ID: #${order.id} (${order.order_reference}) | Date: ${rejectionDateStr} | Status: REJECTED`;

        await NotificationService.notify({
            userId: order.user_id,
            title: 'Land Order Rejected',
            message: rejectionMessage,
            category: 'digital_land',
            type: 'error',
            referenceId: order.id,
            referenceType: 'LAND_ORDER_REJECTED',
            notificationType: 'LAND_ORDER_REJECTED',
            conn
        });

        await conn.commit();

        return res.status(200).json({
            success: true,
            message: `Land order #${order.id} (${order.order_reference}) rejected successfully. User notification delivered.`,
            data: {
                orderId: order.id,
                orderReference: order.order_reference,
                userId: order.user_id,
                projectId: order.project_id,
                projectName: order.project_name,
                status: 'rejected',
                rejectedBy: adminId,
                rejectedAt: new Date(),
                rejectionReason: reason
            }
        });

    } catch (error) {
        await conn.rollback();
        console.error('Reject Land Order Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to reject land order. Please try again.'
        });
    } finally {
        conn.release();
    }
};

