#!/bin/bash
# P1 Quality Multipliers - Implementation Verification Script

echo "================================================"
echo "P1: Quality-Based Intimacy Multipliers"
echo "Implementation Verification"
echo "================================================"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter for tests
PASSED=0
FAILED=0

# Function to check if file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} Found: $1"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} Missing: $1"
        ((FAILED++))
    fi
}

# Function to check if file compiles
check_compile() {
    if node -c "$1" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} Compiles: $1"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} Compile error: $1"
        ((FAILED++))
    fi
}

# Function to check if pattern exists in file
check_pattern() {
    if grep -q "$2" "$1" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} Found pattern in $1: $3"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} Missing pattern in $1: $3"
        ((FAILED++))
    fi
}

echo "=== Step 1: File Existence Checks ==="
echo ""
check_file "src/ika/interactionQuality.js"
check_file "src/database.js"
check_file "src/ika/memory.js"
check_file "src/ika/generator.js"
check_file "test-quality-scoring.js"
echo ""

echo "=== Step 2: Compilation Tests ==="
echo ""
check_compile "src/ika/interactionQuality.js"
check_compile "src/database.js"
check_compile "src/ika/memory.js"
check_compile "src/ika/generator.js"
echo ""

echo "=== Step 3: Integration Checks ==="
echo ""
check_pattern "src/ika/interactionQuality.js" "scoreInteractionQuality" "scoreInteractionQuality function"
check_pattern "src/ika/interactionQuality.js" "getQualityTier" "getQualityTier function"
check_pattern "src/database.js" "recordInteraction(userId, multiplier = 1.0)" "multiplier parameter"
check_pattern "src/database.js" "interaction_count = interaction_count + ?" "SQL multiplier"
check_pattern "src/ika/memory.js" "recordInteraction(userId, multiplier = 1.0)" "memory wrapper"
check_pattern "src/ika/generator.js" "scoreInteractionQuality" "import in generator"
check_pattern "src/ika/generator.js" "recordInteractionWithQuality" "helper function"
echo ""

echo "=== Step 4: Quality Scoring Test ==="
echo ""
if node test-quality-scoring.js > /tmp/test-output.txt 2>&1; then
    echo -e "${GREEN}✓${NC} Quality scoring tests executed"
    ((PASSED++))
    
    # Check for specific test results
    if grep -q "0.50x (minimal)" /tmp/test-output.txt; then
        echo -e "${GREEN}✓${NC} Minimum score (0.5x) working"
        ((PASSED++))
    fi
    
    if grep -q "2.00x (exceptional)" /tmp/test-output.txt; then
        echo -e "${GREEN}✓${NC} Maximum score (2.0x) working"
        ((PASSED++))
    fi
    
    if grep -q "1.50x (high)" /tmp/test-output.txt; then
        echo -e "${GREEN}✓${NC} High quality scoring working"
        ((PASSED++))
    fi
else
    echo -e "${RED}✗${NC} Quality scoring tests failed"
    ((FAILED++))
fi
echo ""

echo "=== Step 5: Documentation Checks ==="
echo ""
check_file "IMPLEMENTATION-NOTES-P1-QUALITY-MULTIPLIERS.md"
check_file "CHANGES-SUMMARY-P1.md"
check_file "USAGE-EXAMPLES-P1.md"
check_file "P1-DELIVERABLES.md"
echo ""

echo "================================================"
echo "Verification Summary"
echo "================================================"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓✓✓ ALL CHECKS PASSED ✓✓✓${NC}"
    echo ""
    echo "Implementation Status: READY FOR DEPLOYMENT"
    echo ""
    echo "Next steps:"
    echo "1. Copy modified files to production"
    echo "2. Restart the bot"
    echo "3. Monitor logs for quality scores"
    echo "4. Watch for patterns: ✧ High/Low quality interaction messages"
    exit 0
else
    echo -e "${RED}✗✗✗ SOME CHECKS FAILED ✗✗✗${NC}"
    echo ""
    echo "Please review the failed checks above."
    exit 1
fi
