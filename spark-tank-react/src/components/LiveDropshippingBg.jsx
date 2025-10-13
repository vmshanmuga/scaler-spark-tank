import React, { useState, useEffect } from 'react';

export default function LiveDropshippingBg({ theme = 'dark' }) {
  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [movingItems, setMovingItems] = useState([]);

  // Theme-aware colors
  const isDark = theme === 'dark';
  const bgColor = isDark ? 'hsl(222.2 84% 4.9%)' : 'hsl(0 0% 98%)';
  const gridColor = isDark ? 'hsl(217.2 32.6% 17.5% / 0.3)' : 'hsl(217.2 32.6% 80% / 0.4)';
  const guideRingColor = isDark ? 'hsl(217.2 32.6% 17.5%)' : 'hsl(217.2 32.6% 75%)';
  const guideRingOpacity = isDark ? 0.3 : 0.5;

  // Node colors - adapt for theme
  const colors = {
    source: isDark ? 'hsl(280 80% 60%)' : 'hsl(280 70% 45%)',
    supplier: isDark ? 'hsl(142.1 76.2% 36.3%)' : 'hsl(142.1 76.2% 35%)',
    warehouse: isDark ? 'hsl(47.9 95.8% 53.1%)' : 'hsl(47.9 95.8% 45%)',
    truck: isDark ? 'hsl(200 80% 55%)' : 'hsl(200 80% 45%)',
    customer: isDark ? 'hsl(221.2 83.2% 53.3%)' : 'hsl(221.2 83.2% 45%)'
  };

  // Concept: Dynamic Dropshipping Ecosystem
  // CENTER: Order Hub - broadcasts orders
  // OUTER RING: Randomly distributed Suppliers, Warehouses, Trucks, Customers
  // Multiple flows happening simultaneously

  useEffect(() => {
    const createNodes = () => {
      const generatedNodes = [];
      const centerX = 50;
      const centerY = 50;
      const radius = 42;

      // CENTER: Order Hub
      generatedNodes.push({
        id: 'source',
        x: centerX,
        y: centerY,
        type: 'source',
        color: colors.source,
        size: 'xlarge'
      });

      // Randomly distribute nodes around the circle
      const totalNodes = 24; // More nodes for simultaneous activity
      const angleStep = (Math.PI * 2) / totalNodes;

      for (let i = 0; i < totalNodes; i++) {
        const angle = i * angleStep + (Math.random() - 0.5) * 0.3; // Add randomness
        const r = radius + (Math.random() - 0.5) * 6; // Vary radius slightly

        // Randomly assign types
        const rand = Math.random();
        let type, color;

        if (rand < 0.2) {
          type = 'supplier';
          color = colors.supplier;
        } else if (rand < 0.5) {
          type = 'warehouse';
          color = colors.warehouse;
        } else if (rand < 0.75) {
          type = 'truck';
          color = colors.truck;
        } else {
          type = 'customer';
          color = colors.customer;
        }

        generatedNodes.push({
          id: `node-${i}`,
          x: centerX + Math.cos(angle) * r,
          y: centerY + Math.sin(angle) * r,
          type: type,
          color: color,
          size: 'small',
          angle: angle
        });
      }

      return generatedNodes;
    };

    setNodes(createNodes());
  }, []);

  useEffect(() => {
    if (nodes.length === 0) return;

    const createConnections = () => {
      const conns = [];
      const source = nodes.find(n => n.type === 'source');
      const suppliers = nodes.filter(n => n.type === 'supplier');
      const warehouses = nodes.filter(n => n.type === 'warehouse');
      const trucks = nodes.filter(n => n.type === 'truck');
      const customers = nodes.filter(n => n.type === 'customer');

      // 1. Source → ALL Suppliers (broadcast orders)
      suppliers.forEach(supplier => {
        conns.push({
          id: `${source.id}-${supplier.id}`,
          from: source,
          to: supplier,
          type: 'order'
        });
      });

      // 2. Each Supplier → Random nearby Warehouses
      suppliers.forEach(supplier => {
        const nearbyWarehouses = warehouses
          .map(w => ({
            warehouse: w,
            distance: Math.sqrt(
              Math.pow(w.x - supplier.x, 2) + Math.pow(w.y - supplier.y, 2)
            )
          }))
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 2) // Connect to 2 nearest warehouses
          .map(item => item.warehouse);

        nearbyWarehouses.forEach(warehouse => {
          conns.push({
            id: `${supplier.id}-${warehouse.id}`,
            from: supplier,
            to: warehouse,
            type: 'parcel'
          });
        });
      });

      // 3. Each Warehouse → Random nearby Trucks
      warehouses.forEach(warehouse => {
        const nearbyTrucks = trucks
          .map(t => ({
            truck: t,
            distance: Math.sqrt(
              Math.pow(t.x - warehouse.x, 2) + Math.pow(t.y - warehouse.y, 2)
            )
          }))
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 2) // Connect to 2 nearest trucks
          .map(item => item.truck);

        nearbyTrucks.forEach(truck => {
          conns.push({
            id: `${warehouse.id}-${truck.id}`,
            from: warehouse,
            to: truck,
            type: 'parcel'
          });
        });
      });

      // 4. Each Truck → Random nearby Customers
      trucks.forEach(truck => {
        const nearbyCustomers = customers
          .map(c => ({
            customer: c,
            distance: Math.sqrt(
              Math.pow(c.x - truck.x, 2) + Math.pow(c.y - truck.y, 2)
            )
          }))
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 3) // Deliver to 3 nearest customers
          .map(item => item.customer);

        nearbyCustomers.forEach(customer => {
          conns.push({
            id: `${truck.id}-${customer.id}`,
            from: truck,
            to: customer,
            type: 'parcel'
          });
        });
      });

      // 5. ALL Customers → Source (money back)
      customers.forEach(customer => {
        conns.push({
          id: `${customer.id}-${source.id}`,
          from: customer,
          to: source,
          type: 'money'
        });
      });

      return conns;
    };

    setConnections(createConnections());
  }, [nodes]);

  // Generate moving items - MUCH MORE FREQUENT
  useEffect(() => {
    if (connections.length === 0) return;

    const createMovingItem = () => {
      const rand = Math.random();
      let selectedType;

      if (rand < 0.25) {
        selectedType = 'order'; // 25% orders
      } else if (rand < 0.7) {
        selectedType = 'parcel'; // 45% parcels
      } else {
        selectedType = 'money'; // 30% money
      }

      const filteredConnections = connections.filter(c => c.type === selectedType);
      if (filteredConnections.length === 0) return null;

      const conn = filteredConnections[Math.floor(Math.random() * filteredConnections.length)];

      return {
        id: Date.now() + Math.random(),
        type: selectedType,
        icon: selectedType === 'order' ? '📋' : selectedType === 'parcel' ? '📦' : '💰',
        color: selectedType === 'order' ? colors.source : selectedType === 'parcel' ? colors.supplier : colors.warehouse,
        connection: conn,
        progress: 0,
        speed: selectedType === 'money' ? 0.015 : selectedType === 'order' ? 0.012 : 0.01
      };
    };

    // Create items much more frequently for simultaneous action
    const interval = setInterval(() => {
      const item = createMovingItem();
      if (item) {
        setMovingItems(prev => [...prev.slice(-50), item]); // Keep more items
      }
    }, 200); // Much faster generation

    return () => clearInterval(interval);
  }, [connections]);

  // Animate moving items
  useEffect(() => {
    const animate = () => {
      setMovingItems(prev =>
        prev.map(item => {
          const newProgress = item.progress + item.speed;
          if (newProgress >= 1) return null;
          return { ...item, progress: newProgress };
        }).filter(Boolean)
      );
    };

    const animationFrame = setInterval(animate, 16);
    return () => clearInterval(animationFrame);
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: '500px',
      left: 0,
      right: 0,
      bottom: 0,
      width: '100vw',
      height: 'calc(100vh - 500px)',
      background: bgColor,
      overflow: 'hidden',
      zIndex: 0,
      opacity: isDark ? 0.55 : 0.35
    }}>
      {/* Grid */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(${gridColor} 1px, transparent 1px),
          linear-gradient(90deg, ${gridColor} 1px, transparent 1px)
        `,
        backgroundSize: '80px 80px',
        maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)'
      }} />

      <div style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(ellipse at center, transparent 0%, ${bgColor.replace(')', ' / 0.8)')} 100%)`
      }} />

      <svg
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '100%',
          height: '100%',
          minWidth: '100vw',
          minHeight: '100vh'
        }}
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <filter id="glow-green">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="glow-yellow">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="glow-purple">
            <feGaussianBlur stdDeviation="1.8" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="glow-blue">
            <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Circular guide rings */}
        <circle cx="50" cy="50" r="42" fill="none" stroke={guideRingColor} strokeWidth="0.08" strokeOpacity={guideRingOpacity} strokeDasharray="1 1" />
        <circle cx="50" cy="50" r="25" fill="none" stroke={guideRingColor} strokeWidth="0.08" strokeOpacity={guideRingOpacity * 0.8} strokeDasharray="0.5 0.5" />

        {/* Connection lines - more visible */}
        {connections.map(conn => {
          const baseOpacity = isDark ? 0.3 : 0.4;
          return (
            <line
              key={conn.id}
              x1={conn.from.x}
              y1={conn.from.y}
              x2={conn.to.x}
              y2={conn.to.y}
              stroke={
                conn.type === 'order' ? `${colors.source.replace(')', ` / ${baseOpacity})`)}` :
                conn.type === 'parcel' ? `${colors.supplier.replace(')', ` / ${baseOpacity})`)}` :
                `${colors.warehouse.replace(')', ` / ${baseOpacity})`)}`
              }
              strokeWidth="0.12"
              strokeDasharray="0.3 0.5"
            />
          );
        })}

        {/* Moving items - LOTS of them */}
        {movingItems.map(item => {
          const conn = item.connection;
          const x = conn.from.x + (conn.to.x - conn.from.x) * item.progress;
          const y = conn.from.y + (conn.to.y - conn.from.y) * item.progress;
          const opacity = Math.sin(item.progress * Math.PI) * 0.9 + 0.1;

          return (
            <g key={item.id}>
              <circle
                cx={x}
                cy={y}
                r="0.8"
                fill={item.color}
                opacity={opacity * 0.6}
                filter={`url(#glow-${item.type === 'order' ? 'purple' : item.type === 'parcel' ? 'green' : 'yellow'})`}
              />
              <text
                x={x}
                y={y}
                fontSize="2.5"
                textAnchor="middle"
                dominantBaseline="middle"
                opacity={opacity}
                style={{ filter: `drop-shadow(0 0 3px ${item.color})` }}
              >
                {item.icon}
              </text>
            </g>
          );
        })}

        {/* Nodes */}
        {nodes.map(node => {
          const size = node.size === 'xlarge' ? 4.5 : 1.8;

          return (
            <g key={node.id}>
              {/* Center hub pulsing rings */}
              {node.size === 'xlarge' && (
                <>
                  <circle cx={node.x} cy={node.y} r={size * 2.2} fill="none" stroke={node.color} strokeWidth="0.12" opacity="0.35" style={{ animation: 'nodeBreath 3s ease-in-out infinite' }} />
                  <circle cx={node.x} cy={node.y} r={size * 2.8} fill="none" stroke={node.color} strokeWidth="0.10" opacity="0.25" style={{ animation: 'nodeBreath 3s ease-in-out infinite 0.5s' }} />
                  <circle cx={node.x} cy={node.y} r={size * 3.4} fill="none" stroke={node.color} strokeWidth="0.08" opacity="0.18" style={{ animation: 'nodeBreath 3s ease-in-out infinite 1s' }} />
                </>
              )}

              {/* Glow */}
              <circle
                cx={node.x}
                cy={node.y}
                r={size * 0.9}
                fill={node.color}
                opacity={isDark ? 0.3 : 0.25}
                filter={`url(#glow-${node.type === 'source' ? 'purple' : node.type === 'supplier' ? 'green' : node.type === 'warehouse' ? 'yellow' : 'blue'})`}
              />

              {/* Icons - smaller for outer nodes */}
              {node.type === 'source' && (
                <g transform={`translate(${node.x}, ${node.y})`}>
                  <circle cx="0" cy="0" r="2.5" fill="none" stroke={node.color} strokeWidth="0.2" />
                  <circle cx="0" cy="0" r="1.5" fill="none" stroke={node.color} strokeWidth="0.15" />
                  <circle cx="0" cy="0" r="0.6" fill={node.color} opacity="0.8" />
                  <line x1="0" y1="-2.5" x2="0" y2="-3.5" stroke={node.color} strokeWidth="0.15" />
                  <line x1="0" y1="2.5" x2="0" y2="3.5" stroke={node.color} strokeWidth="0.15" />
                  <line x1="-2.5" y1="0" x2="-3.5" y2="0" stroke={node.color} strokeWidth="0.15" />
                  <line x1="2.5" y1="0" x2="3.5" y2="0" stroke={node.color} strokeWidth="0.15" />
                </g>
              )}

              {node.type === 'supplier' && (
                <g transform={`translate(${node.x}, ${node.y}) scale(0.7)`}>
                  <rect x="-1" y="-0.6" width="2" height="1.2" fill="none" stroke={node.color} strokeWidth="0.15" />
                  <rect x="-0.6" y="-1.2" width="0.5" height="0.6" fill="none" stroke={node.color} strokeWidth="0.15" />
                  <rect x="0.1" y="-1.2" width="0.5" height="0.6" fill="none" stroke={node.color} strokeWidth="0.15" />
                  <circle cx="-0.35" cy="-1.6" r="0.25" fill="none" stroke={node.color} strokeWidth="0.12" />
                  <circle cx="0.35" cy="-1.6" r="0.25" fill="none" stroke={node.color} strokeWidth="0.12" />
                </g>
              )}

              {node.type === 'warehouse' && (
                <g transform={`translate(${node.x}, ${node.y}) scale(0.7)`}>
                  <rect x="-0.8" y="-0.5" width="1.6" height="1" fill="none" stroke={node.color} strokeWidth="0.15" />
                  <line x1="-0.8" y1="-0.5" x2="0" y2="-1.2" stroke={node.color} strokeWidth="0.15" />
                  <line x1="0.8" y1="-0.5" x2="0" y2="-1.2" stroke={node.color} strokeWidth="0.15" />
                  <rect x="-0.25" y="-0.1" width="0.5" height="0.6" fill="none" stroke={node.color} strokeWidth="0.12" />
                </g>
              )}

              {node.type === 'truck' && (
                <g transform={`translate(${node.x}, ${node.y}) scale(0.7)`}>
                  <rect x="-0.7" y="-0.35" width="1" height="0.7" fill="none" stroke={node.color} strokeWidth="0.15" />
                  <rect x="0.3" y="-0.25" width="0.4" height="0.5" fill="none" stroke={node.color} strokeWidth="0.15" />
                  <circle cx="-0.35" cy="0.45" r="0.2" fill="none" stroke={node.color} strokeWidth="0.12" />
                  <circle cx="0.4" cy="0.45" r="0.2" fill="none" stroke={node.color} strokeWidth="0.12" />
                </g>
              )}

              {node.type === 'customer' && (
                <g transform={`translate(${node.x}, ${node.y}) scale(0.7)`}>
                  <rect x="-0.5" y="-0.25" width="1" height="0.75" fill="none" stroke={node.color} strokeWidth="0.15" />
                  <line x1="-0.5" y1="-0.25" x2="0" y2="-0.85" stroke={node.color} strokeWidth="0.15" />
                  <line x1="0.5" y1="-0.25" x2="0" y2="-0.85" stroke={node.color} strokeWidth="0.15" />
                  <rect x="-0.15" y="0.1" width="0.3" height="0.4" fill="none" stroke={node.color} strokeWidth="0.12" />
                </g>
              )}

              {/* Label for center only */}
              {node.type === 'source' && (
                <text x={node.x} y={node.y + 6} fill={node.color} fontSize="0.9" textAnchor="middle" opacity="0.7" fontWeight="600">
                  ORDER HUB
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Orbs - theme aware */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '15%',
        width: '500px',
        height: '500px',
        background: `radial-gradient(circle, ${colors.source.replace(')', ` / ${isDark ? 0.18 : 0.14})`)} 0%, transparent 70%)`,
        borderRadius: '50%',
        filter: 'blur(60px)',
        animation: 'orbitalFloat 25s ease-in-out infinite'
      }} />
      <div style={{
        position: 'absolute',
        top: '50%',
        right: '15%',
        width: '450px',
        height: '450px',
        background: `radial-gradient(circle, ${colors.warehouse.replace(')', ` / ${isDark ? 0.15 : 0.12})`)} 0%, transparent 70%)`,
        borderRadius: '50%',
        filter: 'blur(60px)',
        animation: 'orbitalFloat 30s ease-in-out infinite reverse'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '20%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '400px',
        height: '400px',
        background: `radial-gradient(circle, ${colors.supplier.replace(')', ` / ${isDark ? 0.15 : 0.12})`)} 0%, transparent 70%)`,
        borderRadius: '50%',
        filter: 'blur(60px)',
        animation: 'orbitalFloat 28s ease-in-out infinite'
      }} />

      <style>{`
        @keyframes nodeBreath {
          0%, 100% { transform: scale(1); opacity: 0.2; }
          50% { transform: scale(1.2); opacity: 0.08; }
        }
        @keyframes orbitalFloat {
          0%, 100% { transform: translate(0, 0); }
          33% { transform: translate(40px, -40px); }
          66% { transform: translate(-40px, 40px); }
        }
        @keyframes scanline {
          0% { transform: translateY(0); opacity: 0; }
          5% { opacity: 1; }
          95% { opacity: 1; }
          100% { transform: translateY(100vh); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
