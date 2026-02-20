# ⚠️ Common Error: "ModuleNotFoundError: No module named 'aiosqlite'"

## The Problem

You see this error:
```
ModuleNotFoundError: No module named 'aiosqlite'
```

## The Cause

You're running Python **without activating the virtual environment**. The system Python doesn't have the required packages installed.

## The Solution

### ✅ Correct Way (Always activate venv first!)

```bash
cd backend
source venv/bin/activate    # ⚠️ THIS IS REQUIRED!
python -m uvicorn api.server:app --host 0.0.0.0 --port 8000 --reload
```

### ✅ Even Easier: Use the launch script

```bash
cd backend
./start.sh
```

The script automatically activates the venv for you!

## How to Verify You're in the venv

After running `source venv/bin/activate`, you should see:
```bash
(venv) ~/path/to/backend $
```

The `(venv)` prefix means you're in the virtual environment.

## Why This Happens

When you run:
```bash
python -m uvicorn api.server:app --reload
```

Without activating venv first, it uses the **system Python** which doesn't have:
- aiosqlite
- fastapi
- httpx
- sentence-transformers
- etc.

## Quick Reference

### ❌ WRONG (will fail):
```bash
cd backend
python -m uvicorn api.server:app --reload  # Missing venv activation!
```

### ✅ CORRECT:
```bash
cd backend
source venv/bin/activate  # Activate first!
python -m uvicorn api.server:app --reload
```

### ✅ EASIEST:
```bash
cd backend
./start.sh  # Does everything for you!
```

## Still Having Issues?

If you still get module errors after activating venv:

```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt  # Reinstall dependencies
```

Then try starting again:
```bash
python -m uvicorn api.server:app --reload
```
