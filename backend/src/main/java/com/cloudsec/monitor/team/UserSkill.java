package com.cloudsec.monitor.team;

import com.cloudsec.monitor.user.User;
import jakarta.persistence.*;

@Entity
@Table(name = "user_skills")
public class UserSkill {

    @EmbeddedId
    private UserSkillId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userId")
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("skillId")
    @JoinColumn(name = "skill_id", nullable = false)
    private Skill skill;

    @Column(nullable = false)
    private int level; // 1 to 3

    public UserSkill() {}

    public UserSkill(User user, Skill skill, int level) {
        this.user = user;
        this.skill = skill;
        this.level = level;
        this.id = new UserSkillId(user.getId(), skill.getId());
    }

    public UserSkillId getId() {
        return id;
    }

    public void setId(UserSkillId id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Skill getSkill() {
        return skill;
    }

    public void setSkill(Skill skill) {
        this.skill = skill;
    }

    public int getLevel() {
        return level;
    }

    public void setLevel(int level) {
        this.level = level;
    }
}
