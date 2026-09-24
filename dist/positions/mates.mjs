// Distinct authored seeds; tablebase evidence is in tests/positions-mates.json.
export const matePositions = {
  "cut-off": [
    {
      "id": "m01",
      "fen": "8/8/3k4/8/2R5/8/1K6/8 w - - 0 1",
      "hint": "Consider moving your rook from c4 to d4. Keep the rook safe while it makes a barrier; bring your king closer before the final checks.",
      "zh": {
        "hint": "可考虑把车从 c4 走到 d4。让车在安全的位置构筑屏障，先把王带近，再寻找最后的将军。"
      }
    },
    {
      "id": "m02",
      "fen": "8/8/8/4k3/5R2/1K6/8/8 w - - 0 1",
      "hint": "Consider moving your rook from f4 to f1. Keep the rook safe while it makes a barrier; bring your king closer before the final checks.",
      "zh": {
        "hint": "可考虑把车从 f4 走到 f1。让车在安全的位置构筑屏障，先把王带近，再寻找最后的将军。"
      }
    },
    {
      "id": "m03",
      "fen": "8/8/8/1k6/6R1/8/4K3/8 w - - 0 1",
      "hint": "Consider moving your rook from g4 to d4. Keep the rook safe while it makes a barrier; bring your king closer before the final checks.",
      "zh": {
        "hint": "可考虑把车从 g4 走到 d4。让车在安全的位置构筑屏障，先把王带近，再寻找最后的将军。"
      }
    },
    {
      "id": "m04",
      "fen": "8/8/6k1/8/8/2K5/7R/8 w - - 0 1",
      "hint": "Consider moving your rook from h2 to f2. Keep the rook safe while it makes a barrier; bring your king closer before the final checks.",
      "zh": {
        "hint": "可考虑把车从 h2 走到 f2。让车在安全的位置构筑屏障，先把王带近，再寻找最后的将军。"
      }
    },
    {
      "id": "m05",
      "fen": "8/8/8/8/2k5/4R3/8/5K2 w - - 0 1",
      "hint": "Consider moving your king from f1 to e2. Keep the rook safe while it makes a barrier; bring your king closer before the final checks.",
      "zh": {
        "hint": "可考虑把王从 f1 走到 e2。让车在安全的位置构筑屏障，先把王带近，再寻找最后的将军。"
      }
    },
    {
      "id": "m06",
      "fen": "8/8/1K1R4/8/5k2/8/8/8 w - - 0 1",
      "hint": "Consider moving your rook from d6 to d4. Keep the rook safe while it makes a barrier; bring your king closer before the final checks.",
      "zh": {
        "hint": "可考虑把车从 d6 走到 d4。让车在安全的位置构筑屏障，先把王带近，再寻找最后的将军。"
      }
    },
    {
      "id": "m07",
      "fen": "8/3k4/8/8/8/6K1/4R3/8 w - - 0 1",
      "hint": "Consider moving your rook from e2 to e5. Keep the rook safe while it makes a barrier; bring your king closer before the final checks.",
      "zh": {
        "hint": "可考虑把车从 e2 走到 e5。让车在安全的位置构筑屏障，先把王带近，再寻找最后的将军。"
      }
    },
    {
      "id": "m08",
      "fen": "8/8/8/8/6k1/8/R7/3K4 w - - 0 1",
      "hint": "Consider moving your rook from a2 to f2. Keep the rook safe while it makes a barrier; bring your king closer before the final checks.",
      "zh": {
        "hint": "可考虑把车从 a2 走到 f2。让车在安全的位置构筑屏障，先把王带近，再寻找最后的将军。"
      }
    }
  ],
  "final-rank": [
    {
      "id": "m01",
      "fen": "2k5/8/1K5R/8/8/8/8/8 w - - 0 1",
      "hint": "Consider moving your rook from h6 to d6. Cover the escape squares before giving the final rook check along the edge.",
      "zh": {
        "hint": "可考虑把车从 h6 走到 d6。先封住逃跑格，再用车沿边线给出最后一将。",
        "objective": "完成边线将杀",
        "description": "对方王已在边线附近。协调王和车，完成最后的杀网。",
        "intro": "封住剩余的逃跑格，寻找最后的将军。"
      },
      "objective": "Finish the edge mate",
      "description": "The defender is near the edge. Coordinate your king and rook to finish the mating net.",
      "intro": "Close the remaining escape squares and find the final checks."
    },
    {
      "id": "m02",
      "fen": "3k4/8/4K3/8/8/6R1/8/8 w - - 0 1",
      "hint": "Consider moving your rook from g3 to c3. Cover the escape squares before giving the final rook check along the edge.",
      "zh": {
        "hint": "可考虑把车从 g3 走到 c3。先封住逃跑格，再用车沿边线给出最后一将。",
        "objective": "完成边线将杀",
        "description": "对方王已在边线附近。协调王和车，完成最后的杀网。",
        "intro": "封住剩余的逃跑格，寻找最后的将军。"
      },
      "objective": "Finish the edge mate",
      "description": "The defender is near the edge. Coordinate your king and rook to finish the mating net.",
      "intro": "Close the remaining escape squares and find the final checks."
    },
    {
      "id": "m03",
      "fen": "4k3/8/3K3R/8/8/8/8/8 w - - 0 1",
      "hint": "Consider moving your rook from h6 to f6. Cover the escape squares before giving the final rook check along the edge.",
      "zh": {
        "hint": "可考虑把车从 h6 走到 f6。先封住逃跑格，再用车沿边线给出最后一将。",
        "objective": "完成边线将杀",
        "description": "对方王已在边线附近。协调王和车，完成最后的杀网。",
        "intro": "封住剩余的逃跑格，寻找最后的将军。"
      },
      "objective": "Finish the edge mate",
      "description": "The defender is near the edge. Coordinate your king and rook to finish the mating net.",
      "intro": "Close the remaining escape squares and find the final checks."
    },
    {
      "id": "m04",
      "fen": "5k2/8/3RK3/8/8/8/8/8 w - - 0 1",
      "hint": "Consider moving your rook from d6 to d7. Cover the escape squares before giving the final rook check along the edge.",
      "zh": {
        "hint": "可考虑把车从 d6 走到 d7。先封住逃跑格，再用车沿边线给出最后一将。",
        "objective": "完成边线将杀",
        "description": "对方王已在边线附近。协调王和车，完成最后的杀网。",
        "intro": "封住剩余的逃跑格，寻找最后的将军。"
      },
      "objective": "Finish the edge mate",
      "description": "The defender is near the edge. Coordinate your king and rook to finish the mating net.",
      "intro": "Close the remaining escape squares and find the final checks."
    },
    {
      "id": "m05",
      "fen": "6k1/8/5K2/8/5R2/8/8/8 w - - 0 1",
      "hint": "Consider moving your rook from f4 to h4. Cover the escape squares before giving the final rook check along the edge.",
      "zh": {
        "hint": "可考虑把车从 f4 走到 h4。先封住逃跑格，再用车沿边线给出最后一将。",
        "objective": "完成边线将杀",
        "description": "对方王已在边线附近。协调王和车，完成最后的杀网。",
        "intro": "封住剩余的逃跑格，寻找最后的将军。"
      },
      "objective": "Finish the edge mate",
      "description": "The defender is near the edge. Coordinate your king and rook to finish the mating net.",
      "intro": "Close the remaining escape squares and find the final checks."
    },
    {
      "id": "m06",
      "fen": "7k/8/5K2/8/8/8/8/5R2 w - - 0 1",
      "hint": "Consider moving your king from f6 to f7. Cover the escape squares before giving the final rook check along the edge.",
      "zh": {
        "hint": "可考虑把王从 f6 走到 f7。先封住逃跑格，再用车沿边线给出最后一将。",
        "objective": "完成边线将杀",
        "description": "对方王已在边线附近。协调王和车，完成最后的杀网。",
        "intro": "封住剩余的逃跑格，寻找最后的将军。"
      },
      "objective": "Finish the edge mate",
      "description": "The defender is near the edge. Coordinate your king and rook to finish the mating net.",
      "intro": "Close the remaining escape squares and find the final checks."
    },
    {
      "id": "m07",
      "fen": "1k6/8/2K2R2/8/8/8/8/8 w - - 0 1",
      "hint": "Consider moving your rook from f6 to f1. Cover the escape squares before giving the final rook check along the edge.",
      "zh": {
        "hint": "可考虑把车从 f6 走到 f1。先封住逃跑格，再用车沿边线给出最后一将。",
        "objective": "完成边线将杀",
        "description": "对方王已在边线附近。协调王和车，完成最后的杀网。",
        "intro": "封住剩余的逃跑格，寻找最后的将军。"
      },
      "objective": "Finish the edge mate",
      "description": "The defender is near the edge. Coordinate your king and rook to finish the mating net.",
      "intro": "Close the remaining escape squares and find the final checks."
    },
    {
      "id": "m08",
      "fen": "k7/8/2K5/8/8/7R/8/8 w - - 0 1",
      "hint": "Consider moving your king from c6 to b6. Cover the escape squares before giving the final rook check along the edge.",
      "zh": {
        "hint": "可考虑把王从 c6 走到 b6。先封住逃跑格，再用车沿边线给出最后一将。",
        "objective": "完成边线将杀",
        "description": "对方王已在边线附近。协调王和车，完成最后的杀网。",
        "intro": "封住剩余的逃跑格，寻找最后的将军。"
      },
      "objective": "Finish the edge mate",
      "description": "The defender is near the edge. Coordinate your king and rook to finish the mating net.",
      "intro": "Close the remaining escape squares and find the final checks."
    }
  ],
  "queen-mate": [
    {
      "id": "m01",
      "fen": "8/8/8/3k4/8/2Q5/K7/8 w - - 0 1",
      "hint": "Consider moving your queen from c3 to e1. Shrink the king’s space, keep your queen safe, and leave a legal move until you can give mate.",
      "zh": {
        "hint": "可考虑把后从 c3 走到 e1。缩小对方王的活动空间，保护好后；将杀之前要给对方保留合法着法。"
      }
    },
    {
      "id": "m02",
      "fen": "8/8/5k2/8/8/QK6/8/8 w - - 0 1",
      "hint": "Consider moving your queen from a3 to a5. Shrink the king’s space, keep your queen safe, and leave a legal move until you can give mate.",
      "zh": {
        "hint": "可考虑把后从 a3 走到 a5。缩小对方王的活动空间，保护好后；将杀之前要给对方保留合法着法。"
      }
    },
    {
      "id": "m03",
      "fen": "7Q/8/8/8/2k5/8/8/6K1 w - - 0 1",
      "hint": "Consider moving your queen from h8 to e5. Shrink the king’s space, keep your queen safe, and leave a legal move until you can give mate.",
      "zh": {
        "hint": "可考虑把后从 h8 走到 e5。缩小对方王的活动空间，保护好后；将杀之前要给对方保留合法着法。"
      }
    },
    {
      "id": "m04",
      "fen": "8/1K6/8/8/8/4k3/Q7/8 w - - 0 1",
      "hint": "Consider moving your queen from a2 to f7. Shrink the king’s space, keep your queen safe, and leave a legal move until you can give mate.",
      "zh": {
        "hint": "可考虑把后从 a2 走到 f7。缩小对方王的活动空间，保护好后；将杀之前要给对方保留合法着法。"
      }
    },
    {
      "id": "m05",
      "fen": "8/8/8/6k1/8/8/2K5/4Q3 w - - 0 1",
      "hint": "Consider moving your queen from e1 to e5. Shrink the king’s space, keep your queen safe, and leave a legal move until you can give mate.",
      "zh": {
        "hint": "可考虑把后从 e1 走到 e5。缩小对方王的活动空间，保护好后；将杀之前要给对方保留合法着法。"
      }
    },
    {
      "id": "m06",
      "fen": "8/8/1k6/8/Q3K3/8/8/8 w - - 0 1",
      "hint": "Consider moving your king from e4 to d4. Shrink the king’s space, keep your queen safe, and leave a legal move until you can give mate.",
      "zh": {
        "hint": "可考虑把王从 e4 走到 d4。缩小对方王的活动空间，保护好后；将杀之前要给对方保留合法着法。"
      }
    },
    {
      "id": "m07",
      "fen": "8/6Q1/8/8/5k2/8/8/3K4 w - - 0 1",
      "hint": "Consider moving your queen from g7 to f6. Shrink the king’s space, keep your queen safe, and leave a legal move until you can give mate.",
      "zh": {
        "hint": "可考虑把后从 g7 走到 f6。缩小对方王的活动空间，保护好后；将杀之前要给对方保留合法着法。"
      }
    },
    {
      "id": "m08",
      "fen": "8/3k4/8/8/8/6K1/8/6Q1 w - - 0 1",
      "hint": "Consider moving your queen from g1 to b6. Shrink the king’s space, keep your queen safe, and leave a legal move until you can give mate.",
      "zh": {
        "hint": "可考虑把后从 g1 走到 b6。缩小对方王的活动空间，保护好后；将杀之前要给对方保留合法着法。"
      }
    }
  ],
  "rook-mate": [
    {
      "id": "m01",
      "fen": "8/8/8/4k3/8/8/8/K1R5 w - - 0 1",
      "hint": "Consider moving your rook from c1 to e1. Use the rook as a barrier and improve your king; checks work best when the escape squares are covered.",
      "zh": {
        "hint": "可考虑把车从 c1 走到 e1。用车构筑屏障，并改善王的位置；封住逃跑格后，将军才更有效。"
      }
    },
    {
      "id": "m02",
      "fen": "R7/8/8/8/2k5/8/6K1/8 w - - 0 1",
      "hint": "Consider moving your rook from a8 to a5. Use the rook as a barrier and improve your king; checks work best when the escape squares are covered.",
      "zh": {
        "hint": "可考虑把车从 a8 走到 a5。用车构筑屏障，并改善王的位置；封住逃跑格后，将军才更有效。"
      }
    },
    {
      "id": "m03",
      "fen": "8/8/5k2/8/8/8/8/2K4R w - - 0 1",
      "hint": "Consider moving your rook from h1 to e1. Use the rook as a barrier and improve your king; checks work best when the escape squares are covered.",
      "zh": {
        "hint": "可考虑把车从 h1 走到 e1。用车构筑屏障，并改善王的位置；封住逃跑格后，将军才更有效。"
      }
    },
    {
      "id": "m04",
      "fen": "8/6K1/8/R7/3k4/8/8/8 w - - 0 1",
      "hint": "Consider moving your rook from a5 to a4. Use the rook as a barrier and improve your king; checks work best when the escape squares are covered.",
      "zh": {
        "hint": "可考虑把车从 a5 走到 a4。用车构筑屏障，并改善王的位置；封住逃跑格后，将军才更有效。"
      }
    },
    {
      "id": "m05",
      "fen": "8/8/2k5/5R2/8/8/5K2/8 w - - 0 1",
      "hint": "Consider moving your king from f2 to e3. Use the rook as a barrier and improve your king; checks work best when the escape squares are covered.",
      "zh": {
        "hint": "可考虑把王从 f2 走到 e3。用车构筑屏障，并改善王的位置；封住逃跑格后，将军才更有效。"
      }
    },
    {
      "id": "m06",
      "fen": "8/8/1K6/8/8/4k3/8/6R1 w - - 0 1",
      "hint": "Consider moving your rook from g1 to g4. Use the rook as a barrier and improve your king; checks work best when the escape squares are covered.",
      "zh": {
        "hint": "可考虑把车从 g1 走到 g4。用车构筑屏障，并改善王的位置；封住逃跑格后，将军才更有效。"
      }
    },
    {
      "id": "m07",
      "fen": "8/8/8/3R4/5k2/8/8/1K6 w - - 0 1",
      "hint": "Consider moving your rook from d5 to a5. Use the rook as a barrier and improve your king; checks work best when the escape squares are covered.",
      "zh": {
        "hint": "可考虑把车从 d5 走到 a5。用车构筑屏障，并改善王的位置；封住逃跑格后，将军才更有效。"
      }
    },
    {
      "id": "m08",
      "fen": "8/8/8/3k4/8/8/7K/6R1 w - - 0 1",
      "hint": "Consider moving your rook from g1 to a1. Use the rook as a barrier and improve your king; checks work best when the escape squares are covered.",
      "zh": {
        "hint": "可考虑把车从 g1 走到 a1。用车构筑屏障，并改善王的位置；封住逃跑格后，将军才更有效。"
      }
    }
  ],
  "ladder-mate": [
    {
      "id": "m01",
      "fen": "8/4k3/8/8/8/8/5RK1/7R w - - 0 1",
      "hint": "Consider moving your rook from h1 to h6. Let one rook block the escape line while the other gives check; keep both rooks out of the king’s reach.",
      "zh": {
        "hint": "可考虑把车从 h1 走到 h6。让一辆车封住逃跑路线，另一辆车将军；两辆车都要避开对方王的攻击。"
      }
    },
    {
      "id": "m02",
      "fen": "8/8/8/3k4/8/7R/1K5R/8 w - - 0 1",
      "hint": "Consider moving your rook from h2 to e2. Let one rook block the escape line while the other gives check; keep both rooks out of the king’s reach.",
      "zh": {
        "hint": "可考虑把车从 h2 走到 e2。让一辆车封住逃跑路线，另一辆车将军；两辆车都要避开对方王的攻击。"
      }
    },
    {
      "id": "m03",
      "fen": "8/8/6k1/8/R7/7R/8/2K5 w - - 0 1",
      "hint": "Consider moving your rook from a4 to f4. Let one rook block the escape line while the other gives check; keep both rooks out of the king’s reach.",
      "zh": {
        "hint": "可考虑把车从 a4 走到 f4。让一辆车封住逃跑路线，另一辆车将军；两辆车都要避开对方王的攻击。"
      }
    },
    {
      "id": "m04",
      "fen": "2k5/8/8/8/8/6K1/4R3/3R4 w - - 0 1",
      "hint": "Consider moving your rook from e2 to e7. Let one rook block the escape line while the other gives check; keep both rooks out of the king’s reach.",
      "zh": {
        "hint": "可考虑把车从 e2 走到 e7。让一辆车封住逃跑路线，另一辆车将军；两辆车都要避开对方王的攻击。"
      }
    },
    {
      "id": "m05",
      "fen": "8/8/8/5k2/8/2R5/K6R/8 w - - 0 1",
      "hint": "Consider moving your rook from h2 to e2. Let one rook block the escape line while the other gives check; keep both rooks out of the king’s reach.",
      "zh": {
        "hint": "可考虑把车从 h2 走到 e2。让一辆车封住逃跑路线，另一辆车将军；两辆车都要避开对方王的攻击。"
      }
    },
    {
      "id": "m06",
      "fen": "8/1k6/8/8/8/R7/4K3/R7 w - - 0 1",
      "hint": "Consider moving your rook from a1 to c1. Let one rook block the escape line while the other gives check; keep both rooks out of the king’s reach.",
      "zh": {
        "hint": "可考虑把车从 a1 走到 c1。让一辆车封住逃跑路线，另一辆车将军；两辆车都要避开对方王的攻击。"
      }
    },
    {
      "id": "m07",
      "fen": "8/8/4k3/8/8/R7/5R2/7K w - - 0 1",
      "hint": "Consider moving your rook from a3 to a5. Let one rook block the escape line while the other gives check; keep both rooks out of the king’s reach.",
      "zh": {
        "hint": "可考虑把车从 a3 走到 a5。让一辆车封住逃跑路线，另一辆车将军；两辆车都要避开对方王的攻击。"
      }
    },
    {
      "id": "m08",
      "fen": "3k4/8/8/8/R7/1R3K2/8/8 w - - 0 1",
      "hint": "Consider moving your rook from b3 to b7. Let one rook block the escape line while the other gives check; keep both rooks out of the king’s reach.",
      "zh": {
        "hint": "可考虑把车从 b3 走到 b7。让一辆车封住逃跑路线，另一辆车将军；两辆车都要避开对方王的攻击。"
      }
    }
  ],
  "bishop-pair": [
    {
      "id": "m01",
      "fen": "4k3/1B6/3K3B/8/8/8/8/8 w - - 0 1",
      "hint": "Consider moving your bishop from b7 to d5. Keep your king close and use both bishops to cover the two colours around the edge.",
      "zh": {
        "hint": "可考虑把象从 b7 走到 d5。让王保持接近，用双象分别控制边线附近两种颜色的格子。"
      }
    },
    {
      "id": "m02",
      "fen": "8/1B6/7k/5K2/8/8/8/B7 w - - 0 1",
      "hint": "Consider moving your bishop from b7 to f3. Keep your king close and use both bishops to cover the two colours around the edge.",
      "zh": {
        "hint": "可考虑把象从 b7 走到 f3。让王保持接近，用双象分别控制边线附近两种颜色的格子。"
      }
    },
    {
      "id": "m03",
      "fen": "1k6/1B6/2K5/8/8/2B5/8/8 w - - 0 1",
      "hint": "Consider moving your bishop from c3 to e5. Keep your king close and use both bishops to cover the two colours around the edge.",
      "zh": {
        "hint": "可考虑把象从 c3 走到 e5。让王保持接近，用双象分别控制边线附近两种颜色的格子。"
      }
    },
    {
      "id": "m04",
      "fen": "5k2/7B/4K3/8/8/8/8/2B5 w - - 0 1",
      "hint": "Consider moving your bishop from c1 to g5. Keep your king close and use both bishops to cover the two colours around the edge.",
      "zh": {
        "hint": "可考虑把象从 c1 走到 g5。让王保持接近，用双象分别控制边线附近两种颜色的格子。"
      }
    },
    {
      "id": "m05",
      "fen": "8/8/8/4B3/5KBk/8/8/8 w - - 0 1",
      "hint": "Consider moving your bishop from e5 to f6. Keep your king close and use both bishops to cover the two colours around the edge.",
      "zh": {
        "hint": "可考虑把象从 e5 走到 f6。让王保持接近，用双象分别控制边线附近两种颜色的格子。"
      }
    },
    {
      "id": "m06",
      "fen": "2k5/8/3K2B1/8/8/2B5/8/8 w - - 0 1",
      "hint": "Consider moving your king from d6 to c6. Keep your king close and use both bishops to cover the two colours around the edge.",
      "zh": {
        "hint": "可考虑把王从 d6 走到 c6。让王保持接近，用双象分别控制边线附近两种颜色的格子。"
      }
    },
    {
      "id": "m07",
      "fen": "6k1/8/4K3/8/8/6B1/6B1/8 w - - 0 1",
      "hint": "Consider moving your king from e6 to f6. Keep your king close and use both bishops to cover the two colours around the edge.",
      "zh": {
        "hint": "可考虑把王从 e6 走到 f6。让王保持接近，用双象分别控制边线附近两种颜色的格子。"
      }
    },
    {
      "id": "m08",
      "fen": "8/7k/2B2K2/8/8/8/8/6B1 w - - 0 1",
      "hint": "Consider moving your bishop from g1 to e3. Keep your king close and use both bishops to cover the two colours around the edge.",
      "zh": {
        "hint": "可考虑把象从 g1 走到 e3。让王保持接近，用双象分别控制边线附近两种颜色的格子。"
      }
    }
  ],
  "bishop-knight": [
    {
      "id": "m01",
      "fen": "5B1k/4N3/5K2/8/8/8/8/8 w - - 0 1",
      "hint": "Consider moving your king from f6 to f7. The h8 corner matches your bishop. Keep the king close and let the knight cover squares the bishop cannot.",
      "zh": {
        "hint": "可考虑把王从 f6 走到 f7。h8 角落与象同色。保持王的接近，用马封住象无法控制的格子。"
      }
    },
    {
      "id": "m02",
      "fen": "7k/8/6K1/8/3N4/8/1B6/8 w - - 0 1",
      "hint": "Consider moving your knight from d4 to f5. The h8 corner matches your bishop. Keep the king close and let the knight cover squares the bishop cannot.",
      "zh": {
        "hint": "可考虑把马从 d4 走到 f5。h8 角落与象同色。保持王的接近，用马封住象无法控制的格子。"
      }
    },
    {
      "id": "m03",
      "fen": "7k/5K2/8/6N1/7B/8/8/8 w - - 0 1",
      "hint": "Consider moving your knight from g5 to e6. The h8 corner matches your bishop. Keep the king close and let the knight cover squares the bishop cannot.",
      "zh": {
        "hint": "可考虑把马从 g5 走到 e6。h8 角落与象同色。保持王的接近，用马封住象无法控制的格子。"
      }
    },
    {
      "id": "m04",
      "fen": "7k/2B5/3NK3/8/8/8/8/8 w - - 0 1",
      "hint": "Consider moving your knight from d6 to f5. The h8 corner matches your bishop. Keep the king close and let the knight cover squares the bishop cannot.",
      "zh": {
        "hint": "可考虑把马从 d6 走到 f5。h8 角落与象同色。保持王的接近，用马封住象无法控制的格子。"
      }
    },
    {
      "id": "m05",
      "fen": "5N1k/8/8/6K1/8/4B3/8/8 w - - 0 1",
      "hint": "Consider moving your king from g5 to g6. The h8 corner matches your bishop. Keep the king close and let the knight cover squares the bishop cannot.",
      "zh": {
        "hint": "可考虑把王从 g5 走到 g6。h8 角落与象同色。保持王的接近，用马封住象无法控制的格子。"
      }
    },
    {
      "id": "m06",
      "fen": "1B5k/4K3/8/8/7N/8/8/8 w - - 0 1",
      "hint": "Consider moving your king from e7 to f7. The h8 corner matches your bishop. Keep the king close and let the knight cover squares the bishop cannot.",
      "zh": {
        "hint": "可考虑把王从 e7 走到 f7。h8 角落与象同色。保持王的接近，用马封住象无法控制的格子。"
      }
    },
    {
      "id": "m07",
      "fen": "7k/8/8/5KN1/5B2/8/8/8 w - - 0 1",
      "hint": "Consider moving your king from f5 to g6. The h8 corner matches your bishop. Keep the king close and let the knight cover squares the bishop cannot.",
      "zh": {
        "hint": "可考虑把王从 f5 走到 g6。h8 角落与象同色。保持王的接近，用马封住象无法控制的格子。"
      }
    },
    {
      "id": "m08",
      "fen": "7k/8/7K/8/3N4/8/5B2/8 w - - 0 1",
      "hint": "Consider moving your knight from d4 to e6. The h8 corner matches your bishop. Keep the king close and let the knight cover squares the bishop cannot.",
      "zh": {
        "hint": "可考虑把马从 d4 走到 e6。h8 角落与象同色。保持王的接近，用马封住象无法控制的格子。"
      }
    }
  ]
};
