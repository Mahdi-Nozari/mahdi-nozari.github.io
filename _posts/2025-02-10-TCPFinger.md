---
title: "Control of a Robotic Finger with TCP Actuators"
date: 2025-02-10 00:00:00 +0350+
type: "Projects"
order: 3
# categories: [Projects]
# tags: [Projects]
image: /personalwebpage/images/FingerDrawing.JPG
description: "Biomimetic robotic finger with antagonistic twisted and coiled polymer actuators controlled in simulation and experiment"
---

In the pursuit of human-like dexterity in robotics, researchers have long sought efficient, lightweight, and responsive actuation systems. Traditional robotic fingers, driven by rigid electric motors, often struggle to replicate the fluid motion and adaptability of the human hand. Our study introduces a biomimetic robotic finger for the Surena-V humanoid robot, utilizing twisted and coiled polymer (TCP) actuators to achieve natural movement and enhanced control. This mechanism is intended for safe robotic interaction as it is compliant to the environment in comparison to previous rigid mechanism designs. 
![Desktop View](/personalwebpage/images/TCPSetup.PNG)
![Desktop View](/personalwebpage/images/TCPResponse.PNG){: width="972" height="589" .w-50 .right}
The research uses a single DoF robotic finger with an antagonistic pair of actuators driving it. The actuators have been characterized and simulated, so the controller can be desined in simulation. Then, a PD contoller is implemented digitally on a microcontroller to validate the simulation results. The comparision between simulation and experiment confirms the enhanced capabilities of this mechanism, and due to the nature of the antagonistic actuator pair, no steady state error is seen.