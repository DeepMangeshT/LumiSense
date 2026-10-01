"""Signal smoothing and filtering service for raw LDR sensor fluctuations.
Maintains a moving-average buffer with dynamic configurable window size.
"""
from collections import deque
from threading import Lock
from typing import Optional
from app.config import settings

class SignalFilter:
    def __init__(self, window_size: int = settings.SMOOTHING_WINDOW_SIZE):
        self._window_size = max(1, window_size)
        self._buffer: deque = deque(maxlen=self._window_size)
        self._lock = Lock()

    def set_window_size(self, new_size: int):
        with self._lock:
            self._window_size = max(1, new_size)
            old_data = list(self._buffer)
            self._buffer = deque(old_data, maxlen=self._window_size)

    @property
    def window_size(self) -> int:
        with self._lock:
            return self._window_size

    def smooth(self, raw_value: int) -> float:
        """Appends raw value and returns smoothed moving average."""
        with self._lock:
            self._buffer.append(raw_value)
            return round(sum(self._buffer) / len(self._buffer), 2)

    def current_smoothed(self) -> Optional[float]:
        with self._lock:
            if not self._buffer:
                return None
            return round(sum(self._buffer) / len(self._buffer), 2)

# Global singleton filter instance
signal_filter = SignalFilter()
