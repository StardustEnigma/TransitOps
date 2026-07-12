import React, { useState, useEffect } from 'react';
import { 
  Calendar, Layers, Download, MoreVertical, Truck, Bus, Car, 
  TrendingDown, TrendingUp, Loader2, AlertCircle
} from 'lucide-react';
import { reportsApi, expensesApi } from '../services/api';
import './Reports.css';

export default function Reports() {
  const [timeRange, setTimeRange] = useState('Last 30 Days');
  const [segment, setSegment] = useState('All Segments');
  const [showRangeMenu, setShowRangeMenu] = useState(false);
  const [showSegmentMenu, setShowSegmentMenu] = useState(false);
  const [hoveredData, setHoveredData] = useState(null);

  const [fuelEfficiency, setFuelEfficiency] = useState([]);
  const [operationalCost, setOperationalCost] = useState([]);
  const [roiData, setRoiData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [csvLoading, setCsvLoading] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.allSettled([
        reportsApi.getFuelEfficiency(),
        reportsApi.getOperationalCost(),
        reportsApi.getRoi()
      ]);

      if (results[0].status === 'fulfilled') {
        setFuelEfficiency(Array.isArray(results[0].value) ? results[0].value : []);
      }
      if (results[1].status === 'fulfilled') {
        setOperationalCost(Array.isArray(results[1].value) ? results[1].value : []);
      }
      if (results[2].status === 'fulfilled') {
        setRoiData(Array.isArray(results[2].value) ? results[2].value : []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = async () => {
    setCsvLoading(true);
    try {
      await reportsApi.downloadCsv();
    } catch (err) {
      // Fallback: generate CSV locally from available data
      const headers = 'Vehicle ID,Fuel Efficiency (km/l),Total Cost ($),ROI\n';
      const rows = roiData.map(v => 
        `${v.vehicleRegistration || v.vehicleId},${v.fuelEfficiency || '--'},${v.totalCost || '--'},${v.roi != null ? v.roi.toFixed(2) : '--'}`
      ).join('\n');
      const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `TransitOps_Report_${timeRange.replace(/\s+/g, '_')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setCsvLoading(false);
    }
  };

  // Compute cost breakdown from operational cost data
  const totalFuelCost = operationalCost.reduce((sum, v) => sum + (v.fuelCost || 0), 0);
  const totalMaintCost = operationalCost.reduce((sum, v) => sum + (v.maintenanceCost || 0), 0);
  const totalOtherCost = operationalCost.reduce((sum, v) => sum + (v.otherCost || 0), 0);
  const grandTotal = totalFuelCost + totalMaintCost + totalOtherCost;
  
  const fuelPct = grandTotal > 0 ? ((totalFuelCost / grandTotal) * 100).toFixed(0) : 0;
  const maintPct = grandTotal > 0 ? ((totalMaintCost / grandTotal) * 100).toFixed(0) : 0;
  const otherPct = grandTotal > 0 ? ((totalOtherCost / grandTotal) * 100).toFixed(0) : 0;
  const totalDisplay = grandTotal >= 1000 ? `$${(grandTotal / 1000).toFixed(0)}K` : `$${grandTotal.toFixed(0)}`;

  // Donut chart math
  const circumference = 2 * Math.PI * 75; // 471.24
  const fuelArc = (parseFloat(fuelPct) / 100) * circumference;
  const maintArc = (parseFloat(maintPct) / 100) * circumference;
  const otherArc = (parseFloat(otherPct) / 100) * circumference;

  // ROI badge helper
  const getRoiBadge = (roi) => {
    if (roi == null) return <span className="roi-pill roi-avg">N/A</span>;
    if (roi > 0.5) return <span className="roi-pill roi-high">High ({(roi * 100).toFixed(0)}%)</span>;
    if (roi > 0.2) return <span className="roi-pill roi-good">Good ({(roi * 100).toFixed(0)}%)</span>;
    if (roi > 0) return <span className="roi-pill roi-avg">Avg ({(roi * 100).toFixed(0)}%)</span>;
    return <span className="roi-pill roi-low">Low ({(roi * 100).toFixed(0)}%)</span>;
  };

  const getVehicleIcon = (reg) => {
    const r = (reg || '').toUpperCase();
    if (r.includes('BUS')) return <Bus size={18} />;
    if (r.includes('VAN')) return <Car size={18} />;
    return <Truck size={18} />;
  };

  // Build fuel efficiency chart data points (use first 6 vehicles)
  const chartVehicles = fuelEfficiency.slice(0, 6);
  const chartXPositions = [65, 170, 275, 380, 485, 590];

  // Scale efficiency values to Y positions (range: 0-20 mapped to y: 254-30)
  const scaleY = (val) => {
    const maxVal = 20;
    const minY = 30;
    const maxY = 254;
    const clamped = Math.min(Math.max(val || 0, 0), maxVal);
    return maxY - ((clamped / maxVal) * (maxY - minY));
  };

  const hasChartData = chartVehicles.length > 0;

  return (
    <div className="reports-page">
      {/* Top Title Banner */}
      <div className="reports-top-title">
        <span>Reports & Analytics</span>
      </div>

      {/* Fleet Performance Header & Action Buttons */}
      <div className="performance-header-bar">
        <div className="performance-title-group">
          <h1 className="performance-title">Fleet Performance</h1>
          <p className="performance-subtitle">
            {loading ? 'Loading operational metrics...' : 'Comprehensive overview of operational metrics.'}
          </p>
        </div>

        <div className="performance-controls">
          <div className="control-dropdown-wrapper">
            <button 
              className="btn-control-filter"
              onClick={() => { setShowRangeMenu(!showRangeMenu); setShowSegmentMenu(false); }}
            >
              <Calendar size={16} className="control-icon" />
              <span>{timeRange}</span>
            </button>
            {showRangeMenu && (
              <div className="control-menu">
                {['Last 7 Days', 'Last 30 Days', 'Last 90 Days', 'Year to Date'].map(range => (
                  <button
                    key={range}
                    className={`control-menu-item ${timeRange === range ? 'active' : ''}`}
                    onClick={() => { setTimeRange(range); setShowRangeMenu(false); }}
                  >
                    {range}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="control-dropdown-wrapper">
            <button 
              className="btn-control-filter"
              onClick={() => { setShowSegmentMenu(!showSegmentMenu); setShowRangeMenu(false); }}
            >
              <Layers size={16} className="control-icon" />
              <span>{segment}</span>
            </button>
            {showSegmentMenu && (
              <div className="control-menu">
                {['All Segments', 'Heavy Fleet (Trucks)', 'Light Fleet (Vans/Buses)'].map(seg => (
                  <button
                    key={seg}
                    className={`control-menu-item ${segment === seg ? 'active' : ''}`}
                    onClick={() => { setSegment(seg); setShowSegmentMenu(false); }}
                  >
                    {seg}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className="btn-download-csv" onClick={handleDownloadCSV} disabled={csvLoading}>
            {csvLoading ? <Loader2 size={16} className="spin-icon" /> : <Download size={16} strokeWidth={2.5} />}
            <span>{csvLoading ? 'Exporting...' : 'Download CSV'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: '#FEF2F2', color: '#DC2626', borderRadius: 8, marginBottom: 16, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Charts Grid */}
      <div className="charts-grid-row">
        {/* Fuel Efficiency Chart */}
        <div className="chart-card efficiency-card">
          <div className="chart-card-header">
            <div>
              <h2 className="chart-card-title">Fuel Efficiency</h2>
              <p className="chart-card-subtitle">
                {hasChartData 
                  ? `Distance / Liters per Vehicle (${chartVehicles.length} vehicles)`
                  : 'Add vehicles and fuel logs to see efficiency data'
                }
              </p>
            </div>
            <button className="btn-more-options" title="Chart Options">
              <MoreVertical size={18} />
            </button>
          </div>

          <div className="line-chart-container">
            {hoveredData && (
              <div className="chart-tooltip" style={{ left: `${hoveredData.x}px`, top: `${hoveredData.y - 45}px` }}>
                <strong>{hoveredData.label}:</strong> {hoveredData.value} km/L
              </div>
            )}

            <svg className="efficiency-svg" viewBox="0 0 650 300" preserveAspectRatio="none">
              <defs>
                <linearGradient id="lightFleetGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#000000" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#000000" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Y-Axis Grid Lines & Labels */}
              {[20, 18, 16, 14, 12, 10, 8, 6, 4, 2, 0].filter((_, i) => i % 2 === 0).map((val, idx) => {
                const y = scaleY(val);
                return (
                  <g key={val}>
                    <text x="25" y={y + 4} className="chart-axis-label text-right">{val}</text>
                    <line x1="45" y1={y} x2="620" y2={y} className="chart-grid-line" />
                  </g>
                );
              })}

              {hasChartData ? (
                <>
                  {/* X-Axis Labels */}
                  {chartVehicles.map((v, idx) => (
                    <text key={idx} x={chartXPositions[idx]} y="280" className="chart-axis-label text-center" style={{ fontSize: 9 }}>
                      {v.vehicleRegistration || `V${v.vehicleId}`}
                    </text>
                  ))}

                  {/* Line connecting points */}
                  <path 
                    d={chartVehicles.map((v, idx) => {
                      const x = chartXPositions[idx];
                      const y = scaleY(v.fuelEfficiency || 0);
                      return `${idx === 0 ? 'M' : 'L'}${x},${y}`;
                    }).join(' ')}
                    fill="none" stroke="#000000" strokeWidth="2.5"
                  />

                  {/* Data Points */}
                  {chartVehicles.map((v, idx) => {
                    const x = chartXPositions[idx];
                    const y = scaleY(v.fuelEfficiency || 0);
                    return (
                      <circle 
                        key={idx} cx={x} cy={y} r="4.5" 
                        className="chart-data-point light-pt"
                        onMouseEnter={() => setHoveredData({ label: v.vehicleRegistration || `Vehicle ${v.vehicleId}`, value: (v.fuelEfficiency || 0).toFixed(2), x, y })}
                        onMouseLeave={() => setHoveredData(null)}
                      />
                    );
                  })}
                </>
              ) : (
                <text x="330" y="150" textAnchor="middle" className="chart-axis-label" style={{ fontSize: 13 }}>
                  No fuel efficiency data yet
                </text>
              )}
            </svg>

            <div className="chart-legend-row">
              <div className="legend-item">
                <span className="legend-dot dot-light"></span>
                <span className="legend-text">Fuel Efficiency (km/L per Vehicle)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cost Breakdown Donut */}
        <div className="chart-card donut-card">
          <div className="chart-card-header">
            <div>
              <h2 className="chart-card-title">Cost Breakdown</h2>
              <p className="chart-card-subtitle">YTD Expenditure</p>
            </div>
          </div>

          <div className="donut-content-wrapper">
            <div className="donut-chart-box">
              <svg className="donut-svg" viewBox="0 0 220 220">
                <g transform="rotate(-90 110 110)">
                  {grandTotal > 0 ? (
                    <>
                      <circle cx="110" cy="110" r="75" fill="transparent" stroke="#000000" strokeWidth="28" 
                        strokeDasharray={`${fuelArc} ${circumference}`} strokeDashoffset="0" className="donut-segment" />
                      <circle cx="110" cy="110" r="75" fill="transparent" stroke="#4A5568" strokeWidth="28" 
                        strokeDasharray={`${maintArc} ${circumference}`} strokeDashoffset={`${-fuelArc}`} className="donut-segment" />
                      <circle cx="110" cy="110" r="75" fill="transparent" stroke="#CBD5E1" strokeWidth="28" 
                        strokeDasharray={`${otherArc} ${circumference}`} strokeDashoffset={`${-(fuelArc + maintArc)}`} className="donut-segment" />
                    </>
                  ) : (
                    <circle cx="110" cy="110" r="75" fill="transparent" stroke="#E2E8F0" strokeWidth="28" />
                  )}
                </g>
                <text x="110" y="103" textAnchor="middle" className="donut-label-text">Total</text>
                <text x="110" y="128" textAnchor="middle" className="donut-total-text">
                  {grandTotal > 0 ? totalDisplay : '$0'}
                </text>
              </svg>
            </div>

            <div className="donut-legend-list">
              <div className="donut-legend-item">
                <div className="donut-legend-label">
                  <span className="donut-dot dot-fuel"></span>
                  <span>Fuel</span>
                </div>
                <span className="donut-percentage">{grandTotal > 0 ? `${fuelPct}%` : '--'}</span>
              </div>
              <div className="donut-legend-item">
                <div className="donut-legend-label">
                  <span className="donut-dot dot-maintenance"></span>
                  <span>Maintenance</span>
                </div>
                <span className="donut-percentage">{grandTotal > 0 ? `${maintPct}%` : '--'}</span>
              </div>
              <div className="donut-legend-item">
                <div className="donut-legend-label">
                  <span className="donut-dot dot-others"></span>
                  <span>Others</span>
                </div>
                <span className="donut-percentage">{grandTotal > 0 ? `${otherPct}%` : '--'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle ROI Heatmap */}
      <div className="chart-card roi-card">
        <div className="chart-card-header roi-header">
          <div>
            <h2 className="chart-card-title">Vehicle ROI</h2>
            <p className="chart-card-subtitle">Return on Investment per Vehicle</p>
          </div>
          <div className="roi-scale-legend">
            <span className="roi-scale-label">Low ROI</span>
            <div className="roi-scale-bar"></div>
            <span className="roi-scale-label">High ROI</span>
          </div>
        </div>

        <div className="table-responsive">
          <table className="roi-table">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th className="text-center">Revenue ($)</th>
                <th className="text-center">Total Cost ($)</th>
                <th className="text-center">ROI</th>
                <th className="text-right">Trend</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '32px 0', color: '#6B7280' }}>
                    <Loader2 size={20} className="spin-icon" style={{ display: 'inline-block', marginRight: 8 }} />
                    Loading ROI data...
                  </td>
                </tr>
              )}
              {!loading && roiData.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '32px 0', color: '#6B7280', fontSize: 13 }}>
                    No ROI data yet. Complete trips and log expenses to generate ROI reports.
                  </td>
                </tr>
              )}
              {!loading && roiData.map((veh) => (
                <tr key={veh.vehicleId || veh.vehicleRegistration} className="roi-row">
                  <td>
                    <div className="roi-vehicle-cell">
                      <div className="roi-vehicle-icon">
                        {getVehicleIcon(veh.vehicleRegistration)}
                      </div>
                      <span className="roi-vehicle-id">{veh.vehicleRegistration || `Vehicle #${veh.vehicleId}`}</span>
                    </div>
                  </td>
                  <td className="text-center">{veh.revenue != null ? `$${veh.revenue.toFixed(0)}` : '--'}</td>
                  <td className="text-center">{veh.totalExpenses != null ? `$${veh.totalExpenses.toFixed(0)}` : '--'}</td>
                  <td className="text-center">{getRoiBadge(veh.roi)}</td>
                  <td className="text-right">
                    <span className="trend-icon-wrapper">
                      {(veh.roi || 0) >= 0 ? (
                        <TrendingUp size={20} className="trend-up" strokeWidth={2.5} />
                      ) : (
                        <TrendingDown size={20} className="trend-down" strokeWidth={2.5} />
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
