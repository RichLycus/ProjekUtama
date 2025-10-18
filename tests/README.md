# ChimeraAI Tests

All test files must be placed in this directory following the `test_*.py` naming convention.

## 🧪 Test Structure

```
tests/
├── test_ipc.py              # IPC communication tests
├── test_python_tools.py     # Python tools execution
├── test_ai_chat.py          # AI chat functionality  
├── test_ui_components.py    # UI component tests
└── ...
```

## 📋 Naming Convention (WAJIB)

### ✅ BENAR:
- `test_feature.py`
- `test_ipc_communication.py`
- `test_tool_execution.py`

### ❌ SALAH:
- `feature_test.py` ❌
- `testing_feature.py` ❌
- `featureTest.py` ❌

## 🏗️ Test File Template

```python
# tests/test_feature.py

import pytest
from unittest.mock import Mock, patch

def test_feature_basic():
    """Test basic feature functionality"""
    # Arrange
    expected = "result"
    
    # Act
    result = my_function()
    
    # Assert
    assert result == expected

def test_feature_edge_case():
    """Test edge case handling"""
    with pytest.raises(ValueError):
        my_function(invalid_input)

def test_feature_with_mock():
    """Test with mocked dependencies"""
    with patch('module.dependency') as mock_dep:
        mock_dep.return_value = "mocked"
        result = my_function()
        assert result == "expected"
```

## 🚀 Running Tests

### All Tests
```bash
pytest tests/
```

### Specific Test File
```bash
pytest tests/test_ipc.py
```

### With Coverage
```bash
pytest --cov=src tests/
```

### Verbose Output
```bash
pytest -v tests/
```

## 📊 Test Categories

### Unit Tests
- Individual functions/methods
- No external dependencies
- Fast execution

### Integration Tests
- Multiple components together
- IPC communication
- Tool execution

### UI Tests
- Component rendering
- User interactions
- Visual regression (future)

## ✅ Test Checklist

Before committing:
```
□ All tests passing
□ Test file in tests/ directory
□ Follows naming convention (test_*.py)
□ Clear test names and docstrings
□ Coverage > 80% (goal)
□ No hardcoded values
□ Mocks external dependencies
```

## 🎯 Test Coverage Goals

- **Phase 0**: Basic IPC tests
- **Phase 1**: UI component tests
- **Phase 2**: Python tools tests (80%+)
- **Phase 3**: AI chat tests (70%+)
- **Phase 4**: Animation tests
- **Phase 5**: E2E tests (90%+)

## 📝 Writing Good Tests

### Good Test:
```python
def test_tool_execution_success():
    """Test successful tool execution with valid input"""
    tool = PythonTool("image-converter")
    result = tool.execute({"input": "test.png", "format": "jpg"})
    
    assert result.success == True
    assert result.output_file.endswith(".jpg")
```

### Bad Test:
```python
def test_thing():  # ❌ Not descriptive
    x = do_thing()  # ❌ No context
    assert x  # ❌ What are we testing?
```

## 🐛 Debugging Tests

### Print Debug Info
```python
def test_feature():
    result = my_function()
    print(f"Debug: {result}")  # Will show with pytest -s
    assert result == expected
```

### Use pytest fixtures
```python
@pytest.fixture
def sample_data():
    return {"key": "value"}

def test_with_fixture(sample_data):
    assert process(sample_data) == expected
```

## 📚 Resources

- [pytest docs](https://docs.pytest.org/)
- [unittest.mock](https://docs.python.org/3/library/unittest.mock.html)
- Testing best practices: `docs/golden-rules.md`

## ⚠️ Important Notes

1. **ALWAYS** put tests in `tests/` directory
2. **ALWAYS** use `test_*.py` naming
3. **NEVER** commit failing tests
4. **ALWAYS** test edge cases
5. **MOCK** external dependencies (API calls, filesystem)

---

**See**: `docs/golden-rules.md` for complete testing rules

**Status**: Ready for Phase 0+ testing  
**Current Coverage**: TBD (tests coming in Phase 1+)
