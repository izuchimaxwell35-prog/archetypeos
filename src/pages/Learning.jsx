import { useState, useEffect } from "react";
import {
  clockIn,
  clockOut,
  getTodaySessions,
  getStreak,
  getLearningHistory,
} from "../services/api";
import {
  Clock,
  Play,
  Square,
  Calendar,
  TrendingUp,
  MessageSquare,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

export default function Learning() {
  const [sessions, setSessions] = useState([]);
  const [todayStats, setTodayStats] = useState(null);
  const [streak, setStreak] = useState(0);
  const [history, setHistory] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [reflection, setReflection] = useState("");
  const [loading, setLoading] = useState(false);
  const [showClockOutModal, setShowClockOutModal] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setFetchLoading(true);
      setError(null);

      const [todayRes, streakRes, historyRes] = await Promise.all([
        getTodaySessions(),
        getStreak(),
        getLearningHistory({ limit: 7 }),
      ]);
      console.log("Today sessions response:", todayRes.data);
      console.log("Streak response:", streakRes.data);
      console.log("Learning history response:", historyRes.data);

      const todayData = todayRes.data;
      setTodayStats(todayData);
      setSessions(todayData.sessions || []);

      const hasActive = todayData.has_active_session === true;
      const activeSess =
        hasActive && todayData.sessions && todayData.sessions.length > 0
          ? todayData.sessions.find((s) => !s.end_time)
          : null;

      setActiveSession(activeSess);
      setStreak(streakRes.data.current_streak || 0);
      setHistory(historyRes.data.history || []);
    } catch (error) {
      console.error("Failed to fetch learning data:", error);
      setError(
        "Failed to load learning data. Please check your connection and try again.",
      );
    } finally {
      setFetchLoading(false);
    }
  };

  const handleClockIn = async () => {
    if (activeSession) {
      alert("You already have an active session. Please clock out first.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await clockIn();
      console.log("Clock-in response:", response.data);

      await fetchData();
      alert("✅ Successfully clocked in! Your learning session has started.");
    } catch (error) {
      console.error("Clock-in error:", error);
      const errorMsg =
        error.response?.data?.error ||
        error.message ||
        "Failed to clock in. Please try again.";
      setError(errorMsg);
      alert("❌ " + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestClockOut = () => {
    if (!activeSession) {
      alert("No active session found. Please clock in first.");
      return;
    }
    setShowClockOutModal(true);
  };

  const handleCancelClockOut = () => {
    setShowClockOutModal(false);
    setReflection("");
    setError(null);
  };

  const handleConfirmClockOut = async () => {
    if (!reflection.trim()) {
      setError("Reflection is required before clocking out.");
      return;
    }

    if (!activeSession) {
      alert("No active session found.");
      setShowClockOutModal(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await clockOut(reflection);
      console.log("Clock-out response:", response.data);

      const hours = response.data.hours_completed || "0";

      setReflection("");
      setShowClockOutModal(false);

      await fetchData();

      alert(`✅ Successfully clocked out! You completed ${hours} hours today.`);
    } catch (error) {
      console.error("Clock-out error:", error);
      const errorMsg =
        error.response?.data?.error ||
        error.message ||
        "Failed to clock out. Please try again.";
      setError(errorMsg);
      alert("❌ " + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading learning data...</p>
        </div>
      </div>
    );
  }

  const requiredHours = 6;
  const currentHours = parseFloat(todayStats?.total_hours || 0);
  const progressPercentage = Math.min(
    (currentHours / requiredHours) * 100,
    100,
  );

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Learning Tracker</h1>
            <p className="mt-2 text-green-100">
              Track your daily 6-hour learning commitment
            </p>
          </div>
          <button
            onClick={fetchData}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            title="Refresh data"
          >
            <RefreshCw className="h-6 w-6" />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Today's Hours</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {currentHours.toFixed(1)}
                <span className="text-lg text-gray-500 ml-1">/ 6 hrs</span>
              </p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <Clock className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">
                Current Streak
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {streak}
                <span className="text-lg text-gray-500 ml-1">days</span>
              </p>
            </div>
            <div className="bg-orange-500 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">
                Sessions Today
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {sessions.length}
              </p>
            </div>
            <div className="bg-purple-500 p-3 rounded-lg">
              <Calendar className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Clock In/Out</h2>

        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Status:</strong>{" "}
            {activeSession ? "🟢 Session Active" : "🔴 No Active Session"}
          </p>
          {activeSession && (
            <p className="text-sm text-blue-700 mt-1">
              Started at:{" "}
              {new Date(activeSession.start_time).toLocaleTimeString()}
            </p>
          )}
        </div>

        {!activeSession ? (
          <div className="space-y-4">
            <button
              onClick={handleClockIn}
              disabled={loading}
              className="w-full md:w-auto flex items-center justify-center px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg shadow-lg"
            >
              <Play className="h-6 w-6 mr-2" />
              {loading ? "Starting Session..." : "Clock In"}
            </button>
            <p className="text-sm text-gray-600">
              Click to start your learning session
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-6 bg-green-50 rounded-lg border-2 border-green-200">
              <div className="flex items-center">
                <div className="animate-pulse bg-green-500 h-4 w-4 rounded-full mr-4"></div>
                <div>
                  <p className="font-bold text-gray-900 text-lg">
                    Session Active
                  </p>
                  <p className="text-sm text-gray-600">
                    Started at{" "}
                    {new Date(activeSession.start_time).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <button
                onClick={handleRequestClockOut}
                disabled={loading}
                className="flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                <Square className="h-5 w-5 mr-2" />
                {loading ? "Processing..." : "Clock Out"}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">7-Day History</h2>
        {history.length > 0 ? (
          <div className="space-y-3">
            {history.map((day, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {new Date(day.date).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                  <p className="text-sm text-gray-600">
                    {day.session_count} sessions
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`text-lg font-bold ${day.meets_requirement ? "text-green-600" : "text-orange-600"}`}
                  >
                    {day.hours} hrs
                  </p>
                  {day.meets_requirement ? (
                    <span className="text-xs text-green-600 font-medium">
                      ✓ Goal met
                    </span>
                  ) : (
                    <span className="text-xs text-orange-600 font-medium">
                      Below goal
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">
            No learning history yet. Start by clocking in!
          </p>
        )}
      </div>

      {showClockOutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full">
            <div className="flex items-center mb-4">
              <div className="bg-yellow-100 p-3 rounded-full mr-4">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Confirm Clock Out
              </h3>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to clock out? Before you go, please share
                a brief reflection on your learning session.
              </p>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MessageSquare className="h-4 w-4 inline mr-1" />
                Learning Reflection (Required)
              </label>
              <textarea
                value={reflection}
                onChange={(e) => {
                  setReflection(e.target.value);
                  setError(null);
                }}
                placeholder="What did you learn today? What challenges did you face? What will you work on next?"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="5"
              />
              {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
              <p className="text-xs text-gray-500 mt-2">
                Your reflection helps you track progress and identify areas for
                improvement.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleConfirmClockOut}
                disabled={loading || !reflection.trim()}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? "Clocking Out..." : "Confirm Clock Out"}
              </button>
              <button
                onClick={handleCancelClockOut}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
