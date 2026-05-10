package de.interaapps.weowe.debt.service

import de.interaapps.weowe.debt.persistence.DebtEventRepository
import de.interaapps.weowe.debt.persistence.DebtGroupRepository
import de.interaapps.weowe.debt.persistence.MemberRepository
import de.interaapps.weowe.debt.persistence.toEntity
import org.springframework.boot.CommandLineRunner
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class DebtDataSeeder {
    @Bean
    fun seedDebtData(
        groupRepository: DebtGroupRepository,
        memberRepository: MemberRepository,
        eventRepository: DebtEventRepository,
    ): CommandLineRunner =
        CommandLineRunner {
            if (groupRepository.count() == 0L) {
                groupRepository.saveAll(DebtSeedData.groups.map { it.toEntity() })
            }
            if (memberRepository.count() == 0L) {
                memberRepository.saveAll(DebtSeedData.members.map { it.toEntity() })
            }
            if (eventRepository.count() == 0L) {
                eventRepository.saveAll(DebtSeedData.events.map { it.toEntity() })
            }
        }
}
